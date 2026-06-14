import { defineFont, defineI18n } from '../scripts/lib/i18n/i18n-config';

export const i18nConfig = defineI18n({
  defaultLocale: 'en-US',
  fonts: {
    primary: defineFont({
      name: 'inter',
      family: 'Inter Variable',
    }),
  },
});
