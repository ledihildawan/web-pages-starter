import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const buildConfigSchema = z.object({
  BUILD_MODE: z.enum(['spa', 'mpa']).default('spa'),
  DEFAULT_LANG: z.enum(['id', 'en']).default('id'),
  DEBUG: z.coerce.boolean().default(false),
});

type BuildConfig = z.infer<typeof buildConfigSchema>;

let cachedConfig: BuildConfig | null = null;

const loadEnvFile = (envPath: string): Record<string, string> => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const envVars: Record<string, string> = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  return envVars;
};

export const getBuildConfig = (): BuildConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  const envVars = loadEnvFile(envPath);

  const config: BuildConfig = buildConfigSchema.parse({
    BUILD_MODE: process.env.BUILD_MODE || envVars.BUILD_MODE,
    DEFAULT_LANG: process.env.DEFAULT_LANG || envVars.DEFAULT_LANG,
    DEBUG: process.env.DEBUG || envVars.DEBUG,
  });

  cachedConfig = config;
  return config;
};

export const isSPAMode = (): boolean => getBuildConfig().BUILD_MODE === 'spa';

export const isMPAMode = (): boolean => getBuildConfig().BUILD_MODE === 'mpa';

export const getDefaultLang = (): string => getBuildConfig().DEFAULT_LANG;

export const isDebugMode = (): boolean => getBuildConfig().DEBUG;

export const clearConfigCache = (): void => {
  cachedConfig = null;
};