const IS_NODE = typeof window === 'undefined';

export const PATHS = {
  ROOT: IS_NODE ? process.cwd() : '',
  LOCALES: 'locales',
  GENERATED: 'generated',
} as const;
