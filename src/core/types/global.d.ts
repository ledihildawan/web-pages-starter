import type { I18nComponents, I18nPages } from '@generated/i18n';
import type { Alpine as AlpineType } from 'alpinejs';
import type { LocaleCode } from './scripts/lib/i18n/data';

declare global {
  interface Window {
    __PAGE_ID__: keyof I18nPages;
    __USED_COMPONENTS__: (keyof I18nComponents)[];
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
