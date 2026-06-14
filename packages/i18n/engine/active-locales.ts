import { LOCALES } from '../../../generated/active-locales-data';
import { i18nConfig } from '../../../src/configs/i18n';
import type { LocaleCode, LocaleConfig } from '../data/locales';

let cachedCodes: LocaleCode[] | undefined;
let cachedLocales: LocaleConfig[] | undefined;

export const getActiveLocaleCodes = (): LocaleCode[] => {
  if (!cachedCodes) {
    cachedCodes = [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])];
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
