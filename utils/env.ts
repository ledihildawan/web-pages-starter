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
  const raw = import.meta.env.APP_ENV;
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
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

const ENV_DEFAULTS = {
  STAGE: 'dev' as (typeof STAGES)[number],
  PORT: 0,
  HOST: '',
  SITE_URL: '',
  NGROK_AUTHTOKEN: undefined as string | undefined,
  NODE_BINARY: undefined as string | undefined,
  RSBUILD_RUNTIME: undefined as string | undefined,
  LIGHTHOUSE_OUTPUT_DIR: '',
  SITEMAP_DEFAULT_PRIORITY: '',
  SITEMAP_DEFAULT_CHANGEFREQ: '',
  BASE_PATH: '/',
  BUILD_PREVIEW: false,
  MINIFY: true,
  PRETTY_HTML: false,
};

export const schemaKeys = Object.keys(ENV_DEFAULTS) as readonly string[];

type TypedEnv = typeof ENV_DEFAULTS & { IS_PROD: boolean };

const rawEnv = readEnv(schemaKeys);

export const env: TypedEnv = {
  ...ENV_DEFAULTS,
  ...rawEnv,
  IS_PROD: (rawEnv.STAGE ?? ENV_DEFAULTS.STAGE) === 'prod',
} as TypedEnv;
