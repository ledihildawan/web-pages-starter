import type { Alpine as AlpineType } from 'alpinejs';
import type {
  I18nCommon,
  I18nComponents,
  I18nPages,
} from '@generated/i18n';
import type { SupportedLanguage } from './configs/locales';

declare global {
  interface Window {
    __PAGE_ID__: keyof I18nPages;
    __USED_COMPONENTS__: (keyof I18nComponents)[];
    __SAVED_LNG__: SupportedLanguage;
    __I18N_DATA__: Record<
      SupportedLanguage,
      {
        common: I18nCommon;
        page: I18nPages[keyof I18nPages];
        comp?: Partial<I18nComponents>;
      }
    >;
    Alpine?: AlpineType;
  }
}
