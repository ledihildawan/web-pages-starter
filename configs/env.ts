import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';
import { resolveRoot } from './paths';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

config({ path: resolveRoot(`.env.${NODE_ENV}`) });

const strToBoolDefaultTrue = z
  .string()
  .optional()
  .transform((v) => v !== 'false');
const strToBoolDefaultFalse = z
  .string()
  .optional()
  .transform((v) => v === 'true');

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(8888),
    HOST: z.string().default('localhost'),
    SITE_URL: z.url(),
    BASE_PATH: z.string().default('/'),
    BUILD_PREVIEW: strToBoolDefaultFalse,
    MINIFY: strToBoolDefaultTrue,
    PRETTY_HTML: strToBoolDefaultFalse,
    FOR_PREVIEW: strToBoolDefaultFalse,
    NGROK_AUTHTOKEN: z.string().optional(),
    NODE_BINARY: z.string().optional(),
    RSBUILD_RUNTIME: z.enum(['node', 'bun']).optional(),
    LIGHTHOUSE_OUTPUT_DIR: z.string().default('./reports'),
    SITEMAP_DEFAULT_PRIORITY: z.string().default('0.7'),
    SITEMAP_DEFAULT_CHANGEFREQ: z.string().default('weekly'),
  },
  isServer: true,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: NODE_ENV === 'test',
});

export const IS_NODE = typeof window === 'undefined';

export const IS_DEV = env.NODE_ENV === 'development';
export const IS_PROD = env.NODE_ENV === 'production';

export type Env = typeof env;
