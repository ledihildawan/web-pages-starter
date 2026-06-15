import path from 'node:path';

const IS_NODE = typeof window === 'undefined';

export const PATHS = {
  ROOT: IS_NODE ? process.cwd() : '',
  LOCALES: 'locales',
  GENERATED: 'generated',
} as const;

export const resolveRoot = (...args: string[]): string =>
  path.resolve(PATHS.ROOT, ...args);
