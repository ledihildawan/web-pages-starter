import { i18nConfig } from '@config/i18n';
import type { CurrencyCode } from '@i18n/data/currencies';
import type { DirectionCode } from '@i18n/data/directions';
import type { LanguageCode } from '@i18n/data/languages';
import { LOCALE_CODES, LOCALES, type LocaleCode, type LocaleConfig } from '@i18n/data/locales';

export const getFallbackChain = (locale: string): LocaleCode[] => {
  if (LOCALE_CODES.includes(locale as LocaleCode)) {
    return [];
  }

  const languageSubtag = locale.split('-')[0];
  const matched = LOCALE_CODES.find((c) => c.startsWith(`${languageSubtag}-`));

  if (matched) {
    return [matched, i18nConfig.defaultLocale];
  }

  return [i18nConfig.defaultLocale];
};

let currentLocale: LocaleCode | undefined;

export const setLocale = (locale: LocaleCode): void => {
  currentLocale = locale;
};

export const getLocale = (locale?: LocaleCode): LocaleCode => {
  const target = locale || currentLocale;
  if (!target) return i18nConfig.defaultLocale;

  if (LOCALE_CODES.includes(target)) {
    return target;
  }

  return getFallbackChain(target)[0] ?? i18nConfig.defaultLocale;
};

export const getLanguageSubtag = (locale: LocaleCode): LanguageCode => {
  const [language, secondPart] = locale.split('-');
  return (secondPart?.length === 4 ? language : locale.split('-')[0]) as LanguageCode;
};

const localeMap = new Map<string, LocaleConfig>(LOCALES.map((l) => [l.code, l]));

export const getLanguageConfig = (locale: LocaleCode): LocaleConfig | undefined => {
  const exact = localeMap.get(locale);
  if (exact) return exact;
  return LOCALES.find((l) => locale.startsWith(`${l.code}-`));
};

export const getCurrency = (locale: LocaleCode): CurrencyCode =>
  getLanguageConfig(locale)?.currency || LOCALES[0].currency;

export const getTimezone = (locale: LocaleCode): string => getLanguageConfig(locale)?.timezone || 'UTC';

export const getTimezoneOffset = (locale: LocaleCode): number => getLanguageConfig(locale)?.timezoneOffset ?? 0;

export const getCalendar = (locale: LocaleCode): string => getLanguageConfig(locale)?.calendar || 'gregory';

export const getFirstDayOfWeek = (locale: LocaleCode): number => getLanguageConfig(locale)?.firstDayOfWeek ?? 0;

export const getNumberingSystem = (locale: LocaleCode): string => getLanguageConfig(locale)?.numberingSystem || 'latn';

export const getDefaultNativeDigits = (locale: LocaleCode): boolean => getLanguageConfig(locale)?.nativeDigits ?? false;

export const getRegionSubtag = (locale: LocaleCode): string | undefined => getLanguageConfig(locale)?.region;

export const getDirection = (locale: LocaleCode): DirectionCode => getLanguageConfig(locale)?.dir || 'ltr';

export const isRTL = (locale: LocaleCode): boolean => getDirection(locale) === 'rtl';

export const getPluralSuffix = (n: number, locale?: LocaleCode): string => {
  const loc = getLocale(locale);
  try {
    const category = new Intl.PluralRules(loc).select(n);
    return `_${category}`;
  } catch {
    return n === 1 ? '_one' : '_other';
  }
};
