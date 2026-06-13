import { defineFont, defineI18n } from '../scripts/lib/i18n/i18n-config';
import type { I18nConfig } from '../scripts/lib/i18n/types';

export const i18nConfig: I18nConfig = defineI18n({
  defaultLocale: 'en-US',
  fonts: {
    primary: defineFont({
      name: 'inter',
      family: 'Inter Variable',
    }),
  },
});
