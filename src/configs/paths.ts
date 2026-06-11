const IS_NODE = typeof window === 'undefined';

export const PATHS = {
  ROOT: IS_NODE ? process.cwd() : '',
  SRC: 'src',
  LOCALES: 'src/locales',
  GENERATED: 'generated',
} as const;