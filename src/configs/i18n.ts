import { defineFont, defineI18n } from '../scripts/lib/i18n/i18n-config';
import type { I18nConfig } from '../scripts/lib/i18n/types';
import type { LocaleCode } from '../scripts/lib/i18n/data';

export const i18nConfig: I18nConfig = defineI18n({
  defaultLocale: (process.env.DEFAULT_LOCALE as LocaleCode) || 'id-ID',
  fonts: {
    primary: defineFont({
      name: 'inter',
      family: 'Inter Variable',
    }),
  },
});
