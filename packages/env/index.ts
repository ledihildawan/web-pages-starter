import type { z } from 'zod';

export const STAGES = ['dev', 'qa', 'uat', 'preprod', 'prod'] as const;

export type SchemaShape = Record<string, z.ZodType>;

export type Inferred<S extends SchemaShape> = {
  [K in keyof S]: z.infer<S[K]>;
};

export type Env<S extends SchemaShape> = Inferred<S> & {
  STAGE: (typeof STAGES)[number];
  IS_PROD: boolean;
};

const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';

let serverLoadPromise: Promise<void> | undefined;
if (!IS_BROWSER) {
  serverLoadPromise = (async () => {
    const mod = (await import(/* webpackIgnore: true */ './server.ts')) as {
      loadServerEnvFiles?: () => Promise<void>;
    };
    if (mod.loadServerEnvFiles) await mod.loadServerEnvFiles();
  })();
}

async function ensureServerLoaded(): Promise<void> {
  if (serverLoadPromise) await serverLoadPromise;
}

function getMetaEnv(): Record<string, unknown> {
  if (IS_BROWSER) return getBrowserEnv();
  return process.env ?? {};
}

function getBrowserEnv(): Record<string, unknown> {
  const raw: Record<string, unknown> = {
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
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = value === undefined || value === null ? undefined : String(value);
  }
  return result;
}

export async function readEnv<S extends SchemaShape>(schema: S): Promise<Env<S>> {
  await ensureServerLoaded();
  const env = getMetaEnv();
  const values = {} as Record<string, unknown>;
  for (const key of Object.keys(schema)) {
    const raw = env[key];
    try {
      values[key] = schema[key].parse(raw);
    } catch {}
  }
  const stage = (values.STAGE as (typeof STAGES)[number]) ?? 'dev';
  return {
    ...values,
    STAGE: stage,
    IS_PROD: stage === 'prod',
  } as Env<S>;
}
