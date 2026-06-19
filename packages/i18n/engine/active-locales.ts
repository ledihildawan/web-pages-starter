import { i18nConfig } from '@config/i18n';
import { LOCALES } from '@generated/active-locales-data';
import type { LocaleCode, LocaleConfig } from '@i18n/data/locales';

let cachedCodes: LocaleCode[] | undefined;
let cachedLocales: LocaleConfig[] | undefined;

export const isSingleLocale = (): boolean => getActiveLocaleCodes().length <= 1;

export const getActiveLocaleCodes = (): LocaleCode[] => {
  if (!cachedCodes) {
    cachedCodes = [...new Set([i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])])];
  }
  return cachedCodes;
};

export const getActiveLocales = (): LocaleConfig[] => {
  if (!cachedLocales) {
    const codes = getActiveLocaleCodes();
    cachedLocales = LOCALES.filter((l) => codes.includes(l.code));
  }
  return cachedLocales;
};
