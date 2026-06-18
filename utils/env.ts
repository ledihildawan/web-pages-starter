import { ENV_KEYS, ENV_SCHEMA, type SchemaEnv } from '@generated/env-schema';

export const STAGES = ['dev', 'qa', 'uat', 'preprod', 'prod'] as const;

const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';

type EnvType = 'string' | 'number' | 'boolean';

function validateValue(key: string, raw: unknown, type: EnvType): unknown {
  if (raw === undefined || raw === null) return undefined;
  if (type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    console.warn(`[env] ${key}: expected boolean, got "${String(raw)}"`);
    return undefined;
  }
  if (type === 'number') {
    if (typeof raw === 'number') return raw;
    const num = Number(raw);
    if (!Number.isNaN(num)) return num;
    console.warn(`[env] ${key}: expected number, got "${String(raw)}"`);
    return undefined;
  }
  if (typeof raw === 'string') return raw;
  return String(raw);
}

function getBrowserEnv(): Record<string, unknown> {
  const source = (import.meta.env ?? {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of ENV_KEYS) {
    result[key] = source[key];
  }
  return result;
}

function getMetaEnv(): Record<string, unknown> {
  if (IS_BROWSER) return getBrowserEnv();
  return process.env ?? {};
}

export function readEnv(): SchemaEnv & { IS_PROD: boolean } {
  const source = getMetaEnv();
  const values: Record<string, unknown> = {};

  for (const key of ENV_KEYS) {
    const field = ENV_SCHEMA[key as keyof typeof ENV_SCHEMA];
    const raw = IS_BROWSER ? source[key] : source[key];
    const validated = validateValue(key, raw, field.type);
    values[key] = validated ?? field.default;
  }

  const stage = (values.STAGE as (typeof STAGES)[number]) ?? 'dev';
  return { ...values, STAGE: stage, IS_PROD: stage === 'prod' } as SchemaEnv & { IS_PROD: boolean };
}

export async function loadServerEnvFiles(): Promise<void> {
  if (typeof process === 'undefined' || !process.versions?.node) return;

  const moduleName = 'node:module';
  const moduleRef = (await import(/* webpackIgnore: true */ moduleName)) as {
    createRequire: (path: string) => NodeRequire;
  };

  const dynamicRequire = moduleRef.createRequire(import.meta.url);
  const fs = dynamicRequire('node:fs') as typeof import('node:fs');
  const path = dynamicRequire('node:path') as typeof import('node:path');

  const cwd = process.cwd();
  const stage = (process.env.STAGE as (typeof STAGES)[number] | undefined) ?? 'dev';
  const files = ['.env', `.env.${stage}`];

  for (const file of files) {
    const filePath = path.resolve(cwd, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');

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

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

export type TypedEnv = SchemaEnv & { IS_PROD: boolean };

const rawEnv = readEnv();

export const env: TypedEnv = rawEnv;

const BROWSER_ENV_KEYS = ['BASE_PATH', 'STAGE'] as const;

export type BrowserEnvType = Pick<TypedEnv, (typeof BROWSER_ENV_KEYS)[number]>;

export const browserEnv = Object.fromEntries(
  BROWSER_ENV_KEYS.map((k) => [k, env[k as keyof typeof env]]),
) as BrowserEnvType;
