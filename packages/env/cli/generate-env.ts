import fs from 'node:fs';
import path from 'node:path';
import { inject, loadTemplate } from '@codegen';
import { lookup } from '@generated/paths';
import { log } from '@scripts/lib/logger';
import { writeFilePath } from '@scripts/lib/write-file';

const ROOT = lookup('@');
const OUTPUT_FILE = lookup('@generated', 'env.ts');

const ENV_FILES = fs.existsSync(ROOT)
  ? fs.readdirSync(ROOT).filter((f) => f.startsWith('.env') && !f.endsWith('.example'))
  : [];
const SKIP_KEYS = new Set(['NODE_ENV']);
const PRIVATE_PREFIX = 'PRIVATE_';
const SECRET_PATTERN = /(?:TOKEN|SECRET|PASSWORD|PASSPHRASE|CREDENTIAL|API_KEY|PRIVATE_KEY)/i;

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

for (const file of ENV_FILES) {
  for (const entry of parseEnvFile(path.join(ROOT, file))) {
    if (!schema.has(entry.key)) {
      schema.set(entry.key, entry.type);
    }
    if (entry.isPrivate) {
      privateKeys.add(entry.key);
    }
  }
}

if (schema.size === 0) {
  log.warn('No .env files found — keeping existing generated/env.ts');
  process.exit(0);
}

for (const key of schema.keys()) {
  if (!privateKeys.has(key) && SECRET_PATTERN.test(key) && key !== 'STAGE') {
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

const template = loadTemplate('env.ts');
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
