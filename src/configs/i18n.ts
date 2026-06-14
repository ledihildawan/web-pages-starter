import { defineFont, defineI18n } from '../../packages/i18n/config/define';

export const i18nConfig = defineI18n({
  defaultLocale: 'en-US',
  fonts: {
    primary: defineFont({
      name: 'inter',
      family: 'Inter Variable',
    }),
  },
});
