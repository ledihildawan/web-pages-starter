import type { BrowserEnvType } from '@generated/env';
import type { I18nPages } from '@generated/i18n';
import type { LocaleCode } from '@i18n/data/locales';
import type { Alpine as AlpineType } from 'alpinejs';

declare module 'alpinejs' {
  namespace Alpine {
    interface Stores {
      [key: string | symbol]: unknown;
      i18n: {
        current: string;
        languages: Array<{ code: string; label: string; flag: string }>;
        change: (code: string) => void;
      };
    }
  }
}

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
    DEV: boolean;
    PROD: boolean;
    MODE: string;
  }
}
