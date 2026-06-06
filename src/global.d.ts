import type { I18nCommon, I18nComponents, I18nPages } from '@generated/i18n';
import type { Alpine as AlpineType } from 'alpinejs';
import type { LocaleCode } from './configs/locales/data';

declare global {
  interface Window {
    __PAGE_ID__: keyof I18nPages;
    __USED_COMPONENTS__: (keyof I18nComponents)[];
    __SAVED_LOCALE__: LocaleCode;
    __I18N_DATA__: Record<
      LocaleCode,
      {
        common: I18nCommon;
        page: I18nPages[keyof I18nPages];
        comp?: Partial<I18nComponents>;
      }
    >;
  }

  var Alpine: AlpineType;

  interface Navigator {
    connection?: {
      saveData: boolean;
      effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    };
  }
}
