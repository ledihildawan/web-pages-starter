export const LOCALES = [
  { code: 'id-ID', language: 'id', region: 'ID', label: 'Bahasa Indonesia', flag: 'id', dir: 'ltr', currency: 'IDR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Asia/Jakarta', timezoneOffset: 7, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'other' },
  { code: 'en-US', language: 'en', region: 'US', label: 'English (US)', flag: 'us', dir: 'ltr', currency: 'USD', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/New_York', timezoneOffset: -5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'en-GB', language: 'en', region: 'GB', label: 'English (UK)', flag: 'gb', dir: 'ltr', currency: 'GBP', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/London', timezoneOffset: 0, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'en-CA', language: 'en', region: 'CA', label: 'English (Canada)', flag: 'ca', dir: 'ltr', currency: 'CAD', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Toronto', timezoneOffset: -5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'en-AU', language: 'en', region: 'AU', label: 'English (Australia)', flag: 'au', dir: 'ltr', currency: 'AUD', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Australia/Sydney', timezoneOffset: 10, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'en-IN', language: 'en', region: 'IN', label: 'English (India)', flag: 'in', dir: 'ltr', currency: 'INR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Asia/Kolkata', timezoneOffset: 5.5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'en-NZ', language: 'en', region: 'NZ', label: 'English (New Zealand)', flag: 'nz', dir: 'ltr', currency: 'NZD', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Pacific/Auckland', timezoneOffset: 12, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'en-ZA', language: 'en', region: 'ZA', label: 'English (South Africa)', flag: 'za', dir: 'ltr', currency: 'ZAR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Africa/Johannesburg', timezoneOffset: 2, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'ja-JP', language: 'ja', region: 'JP', label: '日本語', flag: 'jp', dir: 'ltr', currency: 'JPY', numberingSystem: 'latn', nativeNumberingSystem: 'jpan', nativeDigits: false, timezone: 'Asia/Tokyo', timezoneOffset: 9, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'other' },
  { code: 'zh-CN', language: 'zh', region: 'CN', label: '简体中文', flag: 'cn', dir: 'ltr', currency: 'CNY', numberingSystem: 'latn', nativeNumberingSystem: 'hans', nativeDigits: false, timezone: 'Asia/Shanghai', timezoneOffset: 8, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'other' },
  { code: 'zh-SG', language: 'zh', region: 'SG', label: '中文 (新加坡)', flag: 'sg', dir: 'ltr', currency: 'SGD', numberingSystem: 'latn', nativeNumberingSystem: 'hans', nativeDigits: false, timezone: 'Asia/Singapore', timezoneOffset: 8, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'other' },
  { code: 'zh-TW', language: 'zh', region: 'TW', label: '繁體中文', flag: 'tw', dir: 'ltr', currency: 'TWD', numberingSystem: 'latn', nativeNumberingSystem: 'hant', nativeDigits: false, timezone: 'Asia/Taipei', timezoneOffset: 8, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'other' },
  { code: 'zh-HK', language: 'zh', region: 'HK', label: '繁體中文 (香港)', flag: 'hk', dir: 'ltr', currency: 'HKD', numberingSystem: 'latn', nativeNumberingSystem: 'hant', nativeDigits: false, timezone: 'Asia/Hong_Kong', timezoneOffset: 8, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'other' },
  { code: 'ar-SA', language: 'ar', region: 'SA', label: 'العربية', flag: 'sa', dir: 'rtl', currency: 'SAR', numberingSystem: 'latn', nativeNumberingSystem: 'arab', nativeDigits: true, timezone: 'Asia/Riyadh', timezoneOffset: 3, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: 'zero-one-two-few-many-other' },
  { code: 'ar-AE', language: 'ar', region: 'AE', label: 'العربية (الإمارات)', flag: 'ae', dir: 'rtl', currency: 'AED', numberingSystem: 'latn', nativeNumberingSystem: 'arab', nativeDigits: true, timezone: 'Asia/Dubai', timezoneOffset: 4, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: 'zero-one-two-few-many-other' },
  { code: 'ar-EG', language: 'ar', region: 'EG', label: 'العربية (مصر)', flag: 'eg', dir: 'rtl', currency: 'EGP', numberingSystem: 'latn', nativeNumberingSystem: 'arab', nativeDigits: true, timezone: 'Africa/Cairo', timezoneOffset: 2, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: 'zero-one-two-few-many-other' },
  { code: 'ar-MA', language: 'ar', region: 'MA', label: 'العربية (المغرب)', flag: 'ma', dir: 'rtl', currency: 'MAD', numberingSystem: 'latn', nativeNumberingSystem: 'arab', nativeDigits: true, timezone: 'Africa/Casablanca', timezoneOffset: 0, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: 'zero-one-two-few-many-other' },
  { code: 'ar-TN', language: 'ar', region: 'TN', label: 'العربية (تونس)', flag: 'tn', dir: 'rtl', currency: 'TND', numberingSystem: 'latn', nativeNumberingSystem: 'arab', nativeDigits: true, timezone: 'Africa/Tunis', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: 'zero-one-two-few-many-other' },
  { code: 'es-ES', language: 'es', region: 'ES', label: 'Español', flag: 'es', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Madrid', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'es-MX', language: 'es', region: 'MX', label: 'Español (México)', flag: 'mx', dir: 'ltr', currency: 'MXN', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Mexico_City', timezoneOffset: -6, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'es-AR', language: 'es', region: 'AR', label: 'Español (Argentina)', flag: 'ar', dir: 'ltr', currency: 'ARS', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Argentina/Buenos_Aires', timezoneOffset: -3, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'es-CO', language: 'es', region: 'CO', label: 'Español (Colombia)', flag: 'co', dir: 'ltr', currency: 'COP', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Bogota', timezoneOffset: -5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'es-PE', language: 'es', region: 'PE', label: 'Español (Perú)', flag: 'pe', dir: 'ltr', currency: 'PEN', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Lima', timezoneOffset: -5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'pt-BR', language: 'pt', region: 'BR', label: 'Português (Brasil)', flag: 'br', dir: 'ltr', currency: 'BRL', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Sao_Paulo', timezoneOffset: -3, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'pt-PT', language: 'pt', region: 'PT', label: 'Português (Portugal)', flag: 'pt', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Lisbon', timezoneOffset: 0, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'pt-AO', language: 'pt', region: 'AO', label: 'Português (Angola)', flag: 'ao', dir: 'ltr', currency: 'AOA', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Africa/Luanda', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'pt-MZ', language: 'pt', region: 'MZ', label: 'Português (Moçambique)', flag: 'mz', dir: 'ltr', currency: 'MZN', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Africa/Maputo', timezoneOffset: 2, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'hi-IN', language: 'hi', region: 'IN', label: 'हिन्दी', flag: 'in', dir: 'ltr', currency: 'INR', numberingSystem: 'latn', nativeNumberingSystem: 'deva', nativeDigits: true, timezone: 'Asia/Kolkata', timezoneOffset: 5.5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'hi-NP', language: 'hi', region: 'NP', label: 'हिन्दी (नेपाल)', flag: 'np', dir: 'ltr', currency: 'NPR', numberingSystem: 'latn', nativeNumberingSystem: 'deva', nativeDigits: true, timezone: 'Asia/Kathmandu', timezoneOffset: 5.75, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'ko-KR', language: 'ko', region: 'KR', label: '한국어', flag: 'kr', dir: 'ltr', currency: 'KRW', numberingSystem: 'latn', nativeNumberingSystem: 'kore', nativeDigits: false, timezone: 'Asia/Seoul', timezoneOffset: 9, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'other' },
  { code: 'ko-KP', language: 'ko', region: 'KP', label: '조선말', flag: 'kp', dir: 'ltr', currency: 'KPW', numberingSystem: 'latn', nativeNumberingSystem: 'kore', nativeDigits: false, timezone: 'Asia/Pyongyang', timezoneOffset: 9, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'other' },
  { code: 'fr-FR', language: 'fr', region: 'FR', label: 'Français', flag: 'fr', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Paris', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'fr-CA', language: 'fr', region: 'CA', label: 'Français (Canada)', flag: 'ca', dir: 'ltr', currency: 'CAD', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'America/Montreal', timezoneOffset: -5, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: 'one-other' },
  { code: 'fr-BE', language: 'fr', region: 'BE', label: 'Français (Belgique)', flag: 'be', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Brussels', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'fr-CH', language: 'fr', region: 'CH', label: 'Français (Suisse)', flag: 'ch', dir: 'ltr', currency: 'CHF', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Zurich', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'de-DE', language: 'de', region: 'DE', label: 'Deutsch', flag: 'de', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Berlin', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'de-AT', language: 'de', region: 'AT', label: 'Deutsch (Österreich)', flag: 'at', dir: 'ltr', currency: 'EUR', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Vienna', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'de-CH', language: 'de', region: 'CH', label: 'Deutsch (Schweiz)', flag: 'ch', dir: 'ltr', currency: 'CHF', numberingSystem: 'latn', nativeNumberingSystem: 'latn', nativeDigits: false, timezone: 'Europe/Zurich', timezoneOffset: 1, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-other' },
  { code: 'ru-RU', language: 'ru', region: 'RU', label: 'Русский', flag: 'ru', dir: 'ltr', currency: 'RUB', numberingSystem: 'latn', nativeNumberingSystem: 'cyrl', nativeDigits: false, timezone: 'Europe/Moscow', timezoneOffset: 3, calendar: 'gregory', dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: 'one-few-many' },
] as const;

export type LocaleCode = typeof LOCALES[number]['code'];
export type LanguageCode = typeof LOCALES[number]['language'];
export type RegionCode = typeof LOCALES[number]['region'];
export type CurrencyCode = typeof LOCALES[number]['currency'];
export type NumberingSystemCode = typeof LOCALES[number]['nativeNumberingSystem'];
export type CalendarCode = typeof LOCALES[number]['calendar'];
export type DirectionCode = typeof LOCALES[number]['dir'];

export type LocaleConfig = (typeof LOCALES)[number];

export const LOCALE_CODES = LOCALES.map(l => l.code) as LocaleCode[];
export const LANGUAGE_CODES = [...new Set(LOCALES.map(l => l.language))] as LanguageCode[];
export const REGION_CODES = [...new Set(LOCALES.map(l => l.region))] as RegionCode[];
export const CURRENCY_CODES = [...new Set(LOCALES.map(l => l.currency))] as CurrencyCode[];
export const NUMBERING_SYSTEM_CODES = [...new Set(LOCALES.map(l => l.nativeNumberingSystem))] as NumberingSystemCode[];
export const CALENDAR_CODES = [...new Set(LOCALES.map(l => l.calendar))] as CalendarCode[];
export const DIRECTION_CODES = [...new Set(LOCALES.map(l => l.dir))] as DirectionCode[];

export const LOCALE = LOCALES.reduce((acc, locale) => {
  const key = locale.code.replace(/-/g, '_').toUpperCase();
  return Object.assign(acc, { [key]: locale.code });
}, {} as Record<string, LocaleCode>) as {
    [K in LocaleCode as K extends `${infer L}-${infer R}` ? `${Uppercase<L>}_${Uppercase<R>}` : never]: K
  };

export const LANGUAGE = LANGUAGE_CODES.reduce((acc, language) => {
  const key = language.toUpperCase();
  return Object.assign(acc, { [key]: language });
}, {} as Record<string, LanguageCode>) as {
    [K in LanguageCode as Uppercase<K>]: K
  };

export const REGION = REGION_CODES.reduce((acc, region) => {
  const key = region.toUpperCase();
  return Object.assign(acc, { [key]: region });
}, {} as Record<string, RegionCode>) as {
    [K in RegionCode as Uppercase<K>]: K
  };

export const CURRENCY = CURRENCY_CODES.reduce((acc, currency) => {
  const key = currency.toUpperCase();
  return Object.assign(acc, { [key]: currency });
}, {} as Record<string, CurrencyCode>) as {
    [K in CurrencyCode as Uppercase<K>]: K
  };

export const NUMBERING_SYSTEM = NUMBERING_SYSTEM_CODES.reduce((acc, ns) => {
  const key = ns.toUpperCase();
  return Object.assign(acc, { [key]: ns });
}, {} as Record<string, NumberingSystemCode>) as {
    [K in NumberingSystemCode as Uppercase<K>]: K
  };

export const CALENDAR = CALENDAR_CODES.reduce((acc, calendar) => {
  const key = calendar.toUpperCase();
  return Object.assign(acc, { [key]: calendar });
}, {} as Record<string, CalendarCode>) as {
    [K in CalendarCode as Uppercase<K>]: K
  };

export const DIR = DIRECTION_CODES.reduce((acc, dir) => {
  const key = dir.toUpperCase();
  return Object.assign(acc, { [key]: dir });
}, {} as Record<string, DirectionCode>) as {
    [K in DirectionCode as Uppercase<K>]: K
  };

const LOCALE_FALLBACK_TARGETS = {
  zh: { SG: ['MY'], HK: ['MO'] },

  en: {
    GB: ['ZA', 'IE', 'SG', 'MY', 'HK'],
    AU: ['NZ', 'FJ', 'PG', 'CK', 'TO', 'WS'],
    US: ['PH', 'PR', 'VI', 'BZ', 'GU', 'MP', 'AS'],
    ZA: ['LS', 'NA'],
  },

  es: {
    MX: ['PA', 'CU', 'DO', 'GT', 'HN', 'SV', 'NI', 'CR'],
    CO: ['VE', 'EC'],
    AR: ['CL', 'PY', 'UY'],
    PE: ['BO'],
  },

  pt: {
    PT: ['CV', 'GW', 'ST', 'TL', 'AO', 'MZ'],
  },

  fr: {
    FR: ['LU', 'MC', 'MA', 'TN', 'DZ'],
  },

  de: {
    DE: ['LU'],
    CH: ['LI'],
  },

  ar: {
    AE: ['QA', 'KW', 'BH', 'OM', 'YE', 'IQ'],
    SA: ['JO', 'LB', 'PS', 'SY', 'SO'],
    MA: ['DZ', 'LY', 'TD'],
    EG: ['SD'],
  },

  ru: {
    RU: ['BY', 'KZ', 'KG', 'UA', 'UZ', 'TJ', 'TM', 'AM', 'AZ', 'GE', 'MD'],
  },
} as const;

export const LOCALE_FALLBACKS: Record<string, LocaleCode> = Object.entries(
  LOCALE_FALLBACK_TARGETS,
).reduce((acc, [lang, targets]) => {
  Object.entries(targets).forEach(([region, sources]) => {
    const targetLocale = `${lang}-${region}` as LocaleCode;
    sources.forEach((source: string) => {
      acc[`${lang}-${source}`] = targetLocale;
    });
  });
  return acc;
}, {} as Record<string, LocaleCode>);

export const DEFAULT_LOCALE: LocaleCode = LOCALE.ID_ID;
export const BASE_CURRENCY: CurrencyCode = CURRENCY.USD;
export const LOCALE_STORAGE_KEY = 'i18nextLocale' as const;

export const LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM = LOCALES.reduce(
  (acc, locale) => {
    const ns = locale.nativeNumberingSystem;
    if (!acc[ns]) acc[ns] = [];
    if (!acc[ns].includes(locale.language)) acc[ns].push(locale.language);
    return acc;
  },
  {} as Record<string, LanguageCode[]>,
) as Record<string, LanguageCode[]>;

export const CJK_LANGUAGES = (
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.JPAN] || []
).concat(
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.HANS] || [],
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.KORE] || [],
) as LanguageCode[];

export const ARABIC_LANGUAGES = (
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.ARAB] || []
) as LanguageCode[];

export const DEVANAGARI_LANGUAGES = (
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.DEVA] || []
) as LanguageCode[];

export const CYRILLIC_LANGUAGES = (
  LANGUAGES_BY_NATIVE_NUMBERING_SYSTEM[NUMBERING_SYSTEM.CYRL] || []
) as LanguageCode[];

export const LANGUAGE_GROUPS = {
  CJK: CJK_LANGUAGES,
  ARABIC: ARABIC_LANGUAGES,
  DEVANAGARI: DEVANAGARI_LANGUAGES,
  CYRILLIC: CYRILLIC_LANGUAGES,
} as const;
