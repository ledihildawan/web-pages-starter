import { z } from 'zod';

const envSchema = z.object({
  API_URL: z.string().url().default('http://localhost:3000'),
  API_TIMEOUT: z.coerce.number().int().positive().default(10000),
  ENABLE_MOCK: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LANG: z.enum(['id', 'en']).default('id'),
  APP_NAME: z.string().default('Web Pages Starter'),
  APP_VERSION: z.string().default('0.0.0'),
});

type Env = z.infer<typeof envSchema>;

const loadEnv = (): Env => {
  const envVars = {
    API_URL: import.meta.env.VITE_API_URL ?? process.env.VITE_API_URL,
    API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT ?? process.env.VITE_API_TIMEOUT,
    ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK ?? process.env.VITE_ENABLE_MOCK,
    LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL ?? process.env.VITE_LOG_LEVEL,
    LANG: import.meta.env.VITE_LANG ?? process.env.VITE_LANG,
    APP_NAME: import.meta.env.VITE_APP_NAME ?? process.env.VITE_APP_NAME,
    APP_VERSION: import.meta.env.VITE_APP_VERSION ?? process.env.VITE_APP_VERSION,
  };

  return envSchema.parse(envVars);
};

export const env = loadEnv();

export const isDev = import.meta.env.DEV;

export const isProd = import.meta.env.PROD;

export const getBaseUrl = (): string => env.API_URL;