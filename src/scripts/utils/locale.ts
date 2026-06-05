import {
  BASE_CURRENCY,
  CALENDAR_CODE,
  type CurrencyCode,
  DEFAULT_LOCALE,
  DIRECTION_CODE,
  type DirectionCode,
  type LanguageCode,
  LOCALE_CODES,
  LOCALE_FALLBACKS,
  LOCALES,
  type LocaleCode,
  type LocaleConfig,
  NUMBERING_SYSTEM_CODE,
} from '../../configs/locales';

export const getFallbackChain = (locale: string): LocaleCode[] => {
  if (LOCALE_CODES.includes(locale as LocaleCode)) {
    return [];
  }

  const explicitFallback =
    LOCALE_FALLBACKS[locale as keyof typeof LOCALE_FALLBACKS];
  if (explicitFallback) {
    return [explicitFallback, DEFAULT_LOCALE];
  }

  const languageSubtag = locale.split('-')[0];
  const matched = LOCALE_CODES.find((c) => c.startsWith(`${languageSubtag}-`));

  if (matched) {
    return [matched, DEFAULT_LOCALE];
  }

  return [DEFAULT_LOCALE];
};

let currentLocale: LocaleCode | undefined;

export const setLocale = (locale: LocaleCode): void => {
  currentLocale = locale;
};

export const getLocale = (locale?: LocaleCode): LocaleCode => {
  const target = locale || currentLocale;
  if (!target) return DEFAULT_LOCALE;

  if (LOCALE_CODES.includes(target)) {
    return target;
  }

  return getFallbackChain(target)[0] ?? DEFAULT_LOCALE;
};

export const getLanguageSubtag = (locale: LocaleCode): LanguageCode => {
  const [language, secondPart] = locale.split('-');

  const isScriptTag = secondPart?.length === 4;
  return isScriptTag ? language : (locale.split('-')[0] as LanguageCode);
};

export const getLanguageConfig = (
  locale: LocaleCode,
): LocaleConfig | undefined =>
  LOCALES.find((l) => l.code === locale || locale.startsWith(`${l.code}-`));

export const getCurrency = (locale: LocaleCode): CurrencyCode =>
  getLanguageConfig(locale)?.currency || BASE_CURRENCY;
export const getTimezone = (locale: LocaleCode): string =>
  getLanguageConfig(locale)?.timezone || 'UTC';
export const getTimezoneOffset = (locale: LocaleCode): number =>
  getLanguageConfig(locale)?.timezoneOffset ?? 0;
export const getCalendar = (locale: LocaleCode): string =>
  getLanguageConfig(locale)?.calendar || CALENDAR_CODE.GREGORY;
export const getFirstDayOfWeek = (locale: LocaleCode): number =>
  getLanguageConfig(locale)?.firstDayOfWeek ?? 0;
export const getNumberingSystem = (locale: LocaleCode): string =>
  getLanguageConfig(locale)?.numberingSystem || NUMBERING_SYSTEM_CODE.LATN;
export const getNativeNumberingSystem = (locale: LocaleCode): string =>
  getLanguageConfig(locale)?.nativeNumberingSystem ||
  NUMBERING_SYSTEM_CODE.LATN;
export const getDefaultNativeDigits = (locale: LocaleCode): boolean =>
  getLanguageConfig(locale)?.nativeDigits ?? false;

export const getRegionSubtag = (locale: LocaleCode): string | undefined =>
  getLanguageConfig(locale)?.region;

export const getDirection = (locale: LocaleCode): DirectionCode =>
  getLanguageConfig(locale)?.dir || DIRECTION_CODE.LTR;

export const isRTL = (locale: LocaleCode): boolean =>
  getDirection(locale) === DIRECTION_CODE.RTL;

export const getPluralSuffix = (n: number, locale?: LocaleCode): string => {
  const language = getLocale(locale);
  const rules = getLanguageConfig(language)?.pluralRules;

  if (rules === 'other') return '_other';

  if (rules === 'zero-one-two-few-many-other') {
    if (n === 0) return '_zero';
    if (n === 1) return '_one';
    if (n === 2) return '_two';

    const rem = n % 100;
    if (rem >= 3 && rem <= 10) return '_few';
    if (rem >= 11 && rem <= 99) return '_many';

    return '_other';
  }

  if (rules === 'one-few-many') {
    const rem10 = n % 10;
    const rem100 = n % 100;

    if (rem10 === 1 && rem100 !== 11) return '_one';
    if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14))
      return '_few';
    return '_many';
  }

  return n === 1 ? '_one' : '_other';
};
