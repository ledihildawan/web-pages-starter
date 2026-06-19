import type { BrowserEnvType } from '@generated/env';
import type { I18nPages } from '@generated/i18n';
import type { LocaleCode } from '@i18n/data/locales';
import type { Alpine as AlpineType } from 'alpinejs';
import type { i18nStore } from '@/packages/i18n/runtime/store';

declare global {
  var Alpine: AlpineType;

  interface Window {
    __PAGE_ID__: keyof I18nPages;
    __SAVED_LOCALE__: LocaleCode;
    __SERVER_LOCALE__: LocaleCode;
    __BASE_PATH__: string;
  }

  interface Navigator {
    connection?: {
      saveData: boolean;
      effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    };
  }

  interface ImportMetaEnv extends BrowserEnvType {
    SINGLE_LOCALE: boolean;
    DEFAULT_LOCALE: string;
    FLAG_CDN_BASE: string;
    DEV: boolean;
    PROD: boolean;
    MODE: string;
  }
}
