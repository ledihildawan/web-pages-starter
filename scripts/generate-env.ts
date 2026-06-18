import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from '@utils/common';
import { log } from './lib/logger';
import { generatedHeader, writeFilePath } from './lib/write-file';

const ROOT = resolveRoot();
const OUTPUT_FILE = resolveRoot('generated', 'env-schema.ts');

const ENV_EXAMPLE_FILES = [
  '.env.example',
  '.env.dev.example',
  '.env.prod.example',
  '.env.qa.example',
  '.env.uat.example',
  '.env.preprod.example',
];
const ENV_ACTUAL_FILES = ['.env', '.env.dev', '.env.prod'];

const SKIP_KEYS = new Set(['NODE_ENV']);

type EnvType = 'string' | 'number' | 'boolean';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function inferType(value: string): EnvType {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^-?\d+$/.test(value)) return 'number';
  return 'string';
}

function formatDefault(value: string, type: EnvType): string {
  if (type === 'number') return value;
  if (type === 'boolean') return value;
  return `'${value.replace(/'/g, "\\'")}'`;
}

const schema = new Map<string, { value: string; type: EnvType }>();

for (const file of ENV_EXAMPLE_FILES) {
  const vars = parseEnvFile(path.join(ROOT, file));
  for (const [key, value] of Object.entries(vars)) {
    if (SKIP_KEYS.has(key)) continue;
    if (!schema.has(key)) {
      schema.set(key, { value, type: inferType(value) });
    }
  }
}

for (const file of ENV_ACTUAL_FILES) {
  const vars = parseEnvFile(path.join(ROOT, file));
  for (const [key] of Object.entries(vars)) {
    if (SKIP_KEYS.has(key)) continue;
    if (!schema.has(key)) {
      schema.set(key, { value: '', type: 'string' as EnvType });
    }
  }
}

const entries = Array.from(schema.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, { value, type }]) => `  ${key}: { type: '${type}', default: ${formatDefault(value, type)} }`)
  .join(',\n');

const output = `${generatedHeader('scripts/generate-env.ts')}

export type EnvType = 'string' | 'number' | 'boolean';

export interface EnvField {
  type: EnvType;
  default: string | number | boolean;
}

export const ENV_SCHEMA = {
${entries},
} as const satisfies Record<string, EnvField>;

export const ENV_KEYS = Object.keys(ENV_SCHEMA) as readonly string[];

type SchemaToType<S extends Record<string, { type: string }>> = {
  [K in keyof S]: S[K]['type'] extends 'number'
    ? number
    : S[K]['type'] extends 'boolean'
      ? boolean
      : string;
};

export type SchemaEnv = SchemaToType<typeof ENV_SCHEMA>;
`;

writeFilePath(OUTPUT_FILE, output);
log.success(`Generated env schema — ${schema.size} key(s): ${[...schema.keys()].sort().join(', ')}`);
