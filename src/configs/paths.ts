export const PATHS = {
  SRC: 'src',
  LOCALES: 'src/locales',
  GENERATED: 'generated',
  LOCALES_COMPONENTS: 'src/locales/components',
  DIST: 'dist',
} as const;

export const LOCALE_FILE_EXTENSIONS = ['.json5', '.json'] as const;

export const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates';
