/**
 * Centralized path and directory constants
 * Used by build tools and scripts
 */

export const PATHS = {
  /** Source root directory */
  SRC: 'src',

  /** Locales directory */
  LOCALES: 'src/locales',

  /** Generated files directory */
  GENERATED: 'generated',

  /** Components directory inside locales */
  LOCALES_COMPONENTS: 'src/locales/components',

  /** Dist/build directory */
  DIST: 'dist',
} as const;

export const LOCALE_FILE_EXTENSIONS = ['.json5', '.json'] as const;

export const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates';
