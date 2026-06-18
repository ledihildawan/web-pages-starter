import { readEnv, type STAGES } from '@utils/env';

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

export type { STAGES };

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
