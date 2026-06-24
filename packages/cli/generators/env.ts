import fs from 'node:fs';
import { dirname, join } from 'pathe';
import { fileURLToPath } from 'node:url';
import { log } from '@core/logger';
import { writeFilePath } from '@core/write-file';
import { lookup } from '@generated/paths';

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}

const ROOT = lookup('@');
const OUTPUT_FILE = lookup('@generated', 'env.ts');

const ENV_FILES = fs.existsSync(ROOT)
  ? fs.readdirSync(ROOT).filter((f) => f.startsWith('.env') && !f.endsWith('.example'))
  : [];
const SKIP_KEYS = new Set(['NODE_ENV']);
const PRIVATE_PREFIX = 'PRIVATE_';
const SECRET_WORDS = ['TOKEN', 'SECRET', 'PASSWORD', 'PASSPHRASE', 'CREDENTIAL', 'API_KEY', 'PRIVATE_KEY'];
const isSecretKey = (key: string): boolean => {
  const upper = key.toUpperCase();
  return SECRET_WORDS.some((word) => upper.includes(word));
};

type EnvType = 'string' | 'number' | 'boolean';

interface ParsedKey {
  key: string;
  value: string;
  type: EnvType;
  isPrivate: boolean;
}

function parseEnvFile(filePath: string): ParsedKey[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const results: ParsedKey[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const rawKey = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    let key = rawKey;
    let isPrivate = false;
    if (rawKey.startsWith(PRIVATE_PREFIX)) {
      key = rawKey.slice(PRIVATE_PREFIX.length);
      isPrivate = true;
    }

    if (SKIP_KEYS.has(key)) continue;
    results.push({ key, value, type: inferType(value), isPrivate });
  }
  return results;
}

function inferType(value: string): EnvType {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^-?\d+$/.test(value)) return 'number';
  return 'string';
}

function emptyDefault(type: EnvType): string {
  if (type === 'number') return '0';
  if (type === 'boolean') return 'false';
  return "''";
}

const schema = new Map<string, EnvType>();
const privateKeys = new Set<string>();

const STAGE_ORDER = ['dev', 'qa', 'uat', 'preprod', 'prod'];
const getStagePriority = (file: string): number => {
  const match = file.match(/^\.env\.(\w+)$/);
  if (!match) return -1;
  const stage = match[1];
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? -1 : idx;
};

const sortedEnvFiles = ENV_FILES.sort((a, b) => {
  const priorityA = getStagePriority(a);
  const priorityB = getStagePriority(b);
  if (priorityA === -1 && priorityB === -1) return a.localeCompare(b);
  if (priorityA === -1) return -1;
  if (priorityB === -1) return 1;
  return priorityB - priorityA;
});

for (const file of sortedEnvFiles) {
  for (const entry of parseEnvFile(join(ROOT, file))) {
    schema.set(entry.key, entry.type);
    if (entry.isPrivate) {
      privateKeys.add(entry.key);
    } else {
      privateKeys.delete(entry.key);
    }
  }
}

if (schema.size === 0) {
  log.warn('No .env files found — keeping existing generated/env.ts');
  process.exit(0);
}

for (const key of schema.keys()) {
  if (!privateKeys.has(key) && isSecretKey(key) && key !== 'STAGE') {
    log.warn(`[env] "${key}" looks like a secret but has no PRIVATE_ prefix — will be exposed to browser`);
  }
}

const sortedKeys = Array.from(schema.keys()).sort();
const browserKeys = sortedKeys.filter((k) => !privateKeys.has(k));
const privateKeyList = sortedKeys.filter((k) => privateKeys.has(k));

const browserSchemaEntries = browserKeys
  .map((key) => `  ${key}: { type: '${schema.get(key)}', default: ${emptyDefault(schema.get(key) as EnvType)} }`)
  .join(',\n');

const fullSchemaEntries = sortedKeys
  .map((key) => `      ${key}: { type: '${schema.get(key)}', default: ${emptyDefault(schema.get(key) as EnvType)} }`)
  .join(',\n');

const keyMapEntries = privateKeyList.map((key) => `      ${key}: '${PRIVATE_PREFIX + key}'`).join(',\n');

const browserKeysArray = browserKeys.map((k) => `'${k}'`).join(', ');

const privateTypeEntries = privateKeyList.map((key) => `  ${key}: { type: '${schema.get(key)}' }`).join(',\n');

const TEMPLATE_DIR = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(join(TEMPLATE_DIR, '../templates/env.ts'), 'utf-8');
const output = inject(template, {
  generated_at: new Date().toISOString(),
  browser_schema_entries: browserSchemaEntries,
  browser_keys: browserKeysArray,
  full_schema_entries: fullSchemaEntries,
  key_map_entries: keyMapEntries,
  private_type_entries: privateTypeEntries,
});

writeFilePath(OUTPUT_FILE, output);
log.success(
  `Generated env — ${schema.size} key(s), ${privateKeys.size} private: ${[...privateKeys].sort().join(', ') || 'none'}`,
);
