import type { I18nPages } from '@generated/i18n';
import type { LocaleCode } from '@i18n/data/locales';
import type { Alpine as AlpineType } from 'alpinejs';

declare global {
  interface Window {
    __PAGE_ID__: keyof I18nPages;
    __SAVED_LOCALE__: LocaleCode;
    __SERVER_LOCALE__: LocaleCode;
  }

  var Alpine: AlpineType;

  interface Navigator {
    connection?: {
      saveData: boolean;
      effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    };
  }
}
