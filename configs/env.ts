import { type Env, readEnv, type SchemaShape, type STAGES } from '@web-pages-starter/env';
import { z } from 'zod';

const schema = {
  STAGE: z.enum(['dev', 'qa', 'uat', 'preprod', 'prod']),
  PORT: z.coerce.number(),
  HOST: z.string(),
  SITE_URL: z.url(),
  NGROK_AUTHTOKEN: z.string().optional(),
  NODE_BINARY: z.string().optional(),
  RSBUILD_RUNTIME: z.enum(['node', 'bun']).optional(),
  LIGHTHOUSE_OUTPUT_DIR: z.string(),
  SITEMAP_DEFAULT_PRIORITY: z.string(),
  SITEMAP_DEFAULT_CHANGEFREQ: z.string(),
  BASE_PATH: z.string(),
  BUILD_PREVIEW: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  MINIFY: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  PRETTY_HTML: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
} as const;

export type { Env, SchemaShape, STAGES };

export const schemaKeys = Object.keys(schema) as (keyof typeof schema)[];

export const env: Env<typeof schema> = await readEnv(schema);
