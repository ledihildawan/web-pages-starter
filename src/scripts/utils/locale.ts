import { DEFAULT_LANG, LANGUAGES, BASE_CURRENCY, SUPPORTED_LANG_CODES } from '../../configs/locales';

const FALLBACK_CHAINS: Record<string, string[]> = {
  'zh-SG': ['zh-CN'],
  'zh-TW': ['zh-CN'],
  'zh-HK': ['zh-CN'],
  'en-GB': ['en-US'],
  'en-CA': ['en-US'],
  'en-AU': ['en-US'],
  'en-IN': ['en-US'],
  'es-MX': ['es-ES'],
  'es-AR': ['es-ES'],
  'es-CO': ['es-ES'],
  'es-PE': ['es-ES'],
  'pt-PT': ['pt-BR'],
  'pt-AO': ['pt-BR'],
  'pt-MZ': ['pt-BR'],
  'fr-CA': ['fr-FR'],
  'fr-BE': ['fr-FR'],
  'fr-CH': ['fr-FR'],
  'de-AT': ['de-DE'],
  'de-CH': ['de-DE'],
  'ar-AE': ['ar-SA'],
  'ar-EG': ['ar-SA'],
  'ar-MA': ['ar-SA'],
  'ar-TN': ['ar-SA'],
  'hi-NP': ['hi-IN'],
  'ko-KP': ['ko-KR'],
};

export const getFallbackChain = (locale: string): string[] => {
  if (SUPPORTED_LANG_CODES.includes(locale as typeof SUPPORTED_LANG_CODES[number])) {
    return [];
  }

  const chain = FALLBACK_CHAINS[locale];
  if (chain) {
    return [...chain, DEFAULT_LANG];
  }

  const langCode = locale.split('-')[0];
  const matched = SUPPORTED_LANG_CODES.find((c) => c.startsWith(`${langCode}-`));

  if (matched) {
    return [matched, DEFAULT_LANG];
  }

  return [DEFAULT_LANG];
}

export const getLanguage = (lng?: string): string => {
  if (!lng) return DEFAULT_LANG;

  if (SUPPORTED_LANG_CODES.includes(lng as typeof SUPPORTED_LANG_CODES[number])) {
    return lng;
  }

  return getFallbackChain(lng)[0] ?? DEFAULT_LANG;
};

export const getLangCode = (lng: string): string => lng.split('-')[0];

export const getLanguageConfig = (lng: string) =>
  LANGUAGES.find((l) => l.code === lng || lng.startsWith(`${l.code}-`));

export const getCurrency = (lng: string): string => getLanguageConfig(lng)?.currency || BASE_CURRENCY;
export const getTimezone = (lng: string): string => getLanguageConfig(lng)?.timezone || 'UTC';
export const getTimezoneOffset = (lng: string): number => getLanguageConfig(lng)?.timezoneOffset ?? 0;
export const getCalendar = (lng: string): string => getLanguageConfig(lng)?.calendar || 'gregory';
export const getFirstDayOfWeek = (lng: string): number => getLanguageConfig(lng)?.firstDayOfWeek ?? 0;
export const getNumberingSystem = (lng: string): string => getLanguageConfig(lng)?.numberingSystem || 'latn';
export const getNativeNumberingSystem = (lng: string): string => getLanguageConfig(lng)?.nativeNumberingSystem || 'latn';
export const getUseNativeNumbers = (lng: string): boolean => getLanguageConfig(lng)?.useNativeNumbers ?? false;
export const getRegion = (lng: string): string | undefined => getLanguageConfig(lng)?.region;
export const getCountryCode = (lng: string): string | undefined => getRegion(lng);
export const getDirection = (lng: string): 'ltr' | 'rtl' => getLanguageConfig(lng)?.dir || 'ltr';
export const isRTL = (lng: string): boolean => getDirection(lng) === 'rtl';

export const getPluralSuffix = (n: number, lng: string): string => {
  const rules = getLanguageConfig(lng)?.pluralRules;

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
    if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return '_few';
    return '_many';
  }

  return n === 1 ? '_one' : '_other';
};
