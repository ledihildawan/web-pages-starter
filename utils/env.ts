export const STAGES = ['dev', 'qa', 'uat', 'preprod', 'prod'] as const;

export type Env = Record<string, unknown> & {
  STAGE: (typeof STAGES)[number];
  IS_PROD: boolean;
};

const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';

function getMetaEnv(): Record<string, unknown> {
  if (IS_BROWSER) return getBrowserEnv();
  return process.env ?? {};
}

function getBrowserEnv(): Record<string, unknown> {
  return {
    PORT: import.meta.env.PORT,
    HOST: import.meta.env.HOST,
    SITE_URL: import.meta.env.SITE_URL,
    NGROK_AUTHTOKEN: import.meta.env.NGROK_AUTHTOKEN,
    NODE_BINARY: import.meta.env.NODE_BINARY,
    RSBUILD_RUNTIME: import.meta.env.RSBUILD_RUNTIME,
    LIGHTHOUSE_OUTPUT_DIR: import.meta.env.LIGHTHOUSE_OUTPUT_DIR,
    SITEMAP_DEFAULT_PRIORITY: import.meta.env.SITEMAP_DEFAULT_PRIORITY,
    SITEMAP_DEFAULT_CHANGEFREQ: import.meta.env.SITEMAP_DEFAULT_CHANGEFREQ,
    BASE_PATH: import.meta.env.BASE_PATH,
    STAGE: import.meta.env.STAGE,
    BUILD_PREVIEW: import.meta.env.BUILD_PREVIEW,
    MINIFY: import.meta.env.MINIFY,
    PRETTY_HTML: import.meta.env.PRETTY_HTML,
  };
}

function coerce(raw: unknown): unknown {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') return raw;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  return raw;
}

export function readEnv(keys: readonly string[]): Env {
  const env = getMetaEnv();
  const values: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = IS_BROWSER ? env[key] : coerce(env[key]);
    if (raw !== undefined && raw !== null) {
      values[key] = raw;
    }
  }
  const stage = (values.STAGE as (typeof STAGES)[number]) ?? 'dev';
  return {
    ...values,
    STAGE: stage,
    IS_PROD: stage === 'prod',
  } as Env;
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

const SCHEMA_KEYS = [
  'STAGE',
  'PORT',
  'HOST',
  'SITE_URL',
  'NGROK_AUTHTOKEN',
  'NODE_BINARY',
  'RSBUILD_RUNTIME',
  'LIGHTHOUSE_OUTPUT_DIR',
  'SITEMAP_DEFAULT_PRIORITY',
  'SITEMAP_DEFAULT_CHANGEFREQ',
  'BASE_PATH',
  'BUILD_PREVIEW',
  'MINIFY',
  'PRETTY_HTML',
] as const;

export const schemaKeys = SCHEMA_KEYS as readonly string[];

interface TypedEnv {
  STAGE: (typeof STAGES)[number];
  PORT: number;
  HOST: string;
  SITE_URL: string;
  NGROK_AUTHTOKEN: string | undefined;
  NODE_BINARY: string | undefined;
  RSBUILD_RUNTIME: string | undefined;
  LIGHTHOUSE_OUTPUT_DIR: string;
  SITEMAP_DEFAULT_PRIORITY: string;
  SITEMAP_DEFAULT_CHANGEFREQ: string;
  BASE_PATH: string;
  BUILD_PREVIEW: boolean;
  MINIFY: boolean;
  PRETTY_HTML: boolean;
  IS_PROD: boolean;
}

const rawEnv = readEnv(schemaKeys);

export const env = {
  ...rawEnv,
  MINIFY: rawEnv.MINIFY ?? true,
  BUILD_PREVIEW: rawEnv.BUILD_PREVIEW ?? false,
  PRETTY_HTML: rawEnv.PRETTY_HTML ?? false,
} as unknown as TypedEnv;
