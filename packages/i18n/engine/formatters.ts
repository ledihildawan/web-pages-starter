import { ACTIVE_NUMBERING_SYSTEMS, WRITING_SYSTEM } from '@generated/active-locales-data';
import { EXCHANGE_RATES } from '@generated/exchange-rates';
import type { CurrencyCode } from '../data/currencies';
import type { DateValue } from '@utils/types';
import pluralize from 'pluralize';
import type {
  CardinalOptions,
  DurationOptions,
  FormatOptions,
  ListFormatOptions,
  OrdinalOptions,
  RegionalPrice,
  RelativeTimeOptions,
  TimeFormatOptions,
} from '../config/types';
import { getActiveLocales } from './active-locales';
import { convertCurrencyRaw } from './convert-currency';
import { getCurrency, getLanguageConfig, getLanguageSubtag, getLocale } from './helpers';

const toDateObj = (date: DateValue): Date =>
  typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

const createDigitConverter = (digitsArray: readonly string[]) => (num: number | string) =>
  String(num).replace(/\d/g, (d) => digitsArray[Number(d)]);

const NATIVE_DIGITS_MAP = getActiveLocales().reduce(
  (acc, locale) => {
    const lang = locale.language;
    const ns = locale.nativeNumberingSystem;

    if (acc[lang]) return acc;

    const nsConfig = ACTIVE_NUMBERING_SYSTEMS.find((config) => config.code === ns);
    if (nsConfig?.digits) {
      acc[lang] = createDigitConverter(nsConfig.digits);
    }

    return acc;
  },
  {} as Record<string, (num: number | string) => string>,
);

const getNumberingSystem = (options: FormatOptions = {}) => {
  if (options.numberingSystem) return options.numberingSystem;
  if (options.nativeDigits) {
    return getLanguageConfig(getLocale())?.nativeNumberingSystem || 'latn';
  }
  return getLanguageConfig(getLocale())?.numberingSystem || 'latn';
};

export const toNativeDigits = (text: string, force?: boolean) => {
  if (force === false) return text;

  const localeConfig = getLanguageConfig(getLocale());
  const shouldConvert = force === true || (force === undefined && localeConfig?.nativeDigits);

  if (!shouldConvert) return text;

  try {
    const formatter = new Intl.NumberFormat(getLocale(), {
      numberingSystem: localeConfig?.nativeNumberingSystem || 'latn',
    });
    const testNum = 0;
    const formatted = formatter.format(testNum);
    if (formatted !== '0') {
      return text.replace(/\d/g, (d) => formatter.format(Number(d)));
    }
  } catch {}

  const languageSubtag = getLanguageSubtag(getLocale());
  const converter = NATIVE_DIGITS_MAP[languageSubtag];
  return converter ? converter(text) : text;
};

const safeIntlFormat = (options: Intl.NumberFormatOptions, num: number, fallback: string) => {
  try {
    return new Intl.NumberFormat(getLocale(), options).format(num);
  } catch {
    return fallback;
  }
};

const ALGORITHMIC_SYSTEMS = [
  'jpan',
  'hans',
  'hant',
  'kore',
  'cyrl',
  'taml',
  'geor',
  'armn',
  'ethi',
  'grek',
  'hebr',
  'roman',
] as const;

const convertLatinDigits = (text: string, targetDigits: readonly string[]) =>
  text.replace(/\d/g, (d) => targetDigits[Number(d)]);

const toRoman = (num: number): string => {
  if (num <= 0 || num > 3999) return String(num);
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
};

const applyDigitsFallback = (result: string, numberingSystem: string, num?: number) => {
  if (!ALGORITHMIC_SYSTEMS.includes(numberingSystem as (typeof ALGORITHMIC_SYSTEMS)[number])) {
    return result;
  }
  if (numberingSystem === 'roman') {
    if (num !== undefined) return toRoman(num);
    if (!/\d/.test(result)) return result;
    const parsed = parseInt(result.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? result : toRoman(parsed);
  }
  const nsConfig = ACTIVE_NUMBERING_SYSTEMS.find((ns) => ns.code === numberingSystem);
  if (!nsConfig?.digits) return result;
  if (/\d/.test(result)) {
    return convertLatinDigits(result, nsConfig.digits);
  }
  if (num !== undefined) {
    return convertLatinDigits(String(num), nsConfig.digits);
  }
  return result;
};

let cardinalStrategies: Record<string, (num: number, gender?: 'masculine' | 'feminine') => string> = {};
let ordinalStrategies: Record<string, (num: number) => string> = {};

export const setStrategies = (cardinal: typeof cardinalStrategies, ordinal: typeof ordinalStrategies) => {
  cardinalStrategies = cardinal;
  ordinalStrategies = ordinal;
};

export const formatCardinal = (value: number | string, options: CardinalOptions = {}) => {
  const num = parseInt(`${value}`, 10);
  if (Number.isNaN(num)) return `${value}`;
  const strategy = cardinalStrategies[getLanguageSubtag(getLocale())];
  if (!strategy) return `${num}`;
  return strategy(num, options.gender) ?? `${num}`;
};

export const formatOrdinal = (value: number | string, _options?: OrdinalOptions) => {
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return `${value}`;

  const code = getLanguageSubtag(getLocale());
  if (ordinalStrategies[code]) return ordinalStrategies[code](num);

  try {
    const ordinalSuffixes: Record<string, Record<string, string>> = {
      one: { en: 'st' },
      two: { en: 'nd' },
      few: { en: 'rd' },
      other: { en: 'th' },
      zero: { en: 'th' },
      many: { en: 'th' },
    };
    const category = new Intl.PluralRules(getLocale(), {
      type: 'ordinal',
    }).select(num);
    const suffix = ordinalSuffixes[category]?.[getLanguageSubtag(getLocale())] ?? ordinalSuffixes[category]?.en ?? 'th';
    return `${num}${suffix}`;
  } catch {
    const rem = num % 100;
    if (rem >= 11 && rem <= 13) return `${num}th`;
    return `${num}${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][num % 10] ?? 'th'}`;
  }
};

const processNumeric = (
  value: number | string,
  options: FormatOptions,
  intlOptions: Intl.NumberFormatOptions,
  config: {
    invalid: (val: string | number) => string;
    intlFallback: (num: number) => string;
    cjk?: (num: number, languageSubtag: string) => string;
    arabicFallback: (num: number) => string;
    devanagariFallback: (num: number) => string;
    cyrillicFallback: (num: number) => string;
  },
) => {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (Number.isNaN(num)) return config.invalid(value);

  const languageSubtag = getLanguageSubtag(getLocale());

  if (options.nativeDigits && !options.numberingSystem) {
    const cjkLanguages = (WRITING_SYSTEM.CJK_LANGUAGES ?? []) as readonly string[];
    if (config.cjk && cjkLanguages.includes(languageSubtag)) return config.cjk(num, languageSubtag);

    const digitRules: {
      languages: readonly string[];
      converter: (num: number | string) => string;
      fallback: (num: number) => string;
    }[] = [
      {
        languages: (WRITING_SYSTEM.ARABIC_LANGUAGES ?? []) as readonly string[],
        converter: NATIVE_DIGITS_MAP.ar,
        fallback: config.arabicFallback,
      },
      {
        languages: (WRITING_SYSTEM.DEVANAGARI_LANGUAGES ?? []) as readonly string[],
        converter: NATIVE_DIGITS_MAP.hi,
        fallback: config.devanagariFallback,
      },
      {
        languages: (WRITING_SYSTEM.CYRILLIC_LANGUAGES ?? []) as readonly string[],
        converter: NATIVE_DIGITS_MAP.ru,
        fallback: config.cyrillicFallback,
      },
    ];

    const matchedRule = digitRules.find((rule) => rule.languages.includes(languageSubtag));

    if (matchedRule) {
      const intlOpts = { ...intlOptions, ...options };
      delete intlOpts.nativeDigits;
      const intlResult = safeIntlFormat(intlOpts, num, '');

      return intlResult ? matchedRule.converter(intlResult) : matchedRule.fallback(num);
    }
  }

  const numberingSystem = options.numberingSystem ?? getNumberingSystem(options);
  const result = safeIntlFormat(
    {
      ...intlOptions,
      numberingSystem,
      ...options,
    },
    num,
    config.intlFallback(num),
  );
  return applyDigitsFallback(result, numberingSystem, num);
};

export const formatNumber = (value: number | string, options: FormatOptions = {}) =>
  processNumeric(
    value,
    options,
    {},
    {
      invalid: String,
      intlFallback: String,
      cjk: (num, _languageSubtag) => formatCardinal(num),
      arabicFallback: NATIVE_DIGITS_MAP.ar,
      devanagariFallback: NATIVE_DIGITS_MAP.hi,
      cyrillicFallback: NATIVE_DIGITS_MAP.ru,
    },
  );

export const formatCurrency = (value: number | string, currency: string, options: FormatOptions = {}) => {
  return processNumeric(
    value,
    options,
    { style: 'currency', currency },
    {
      invalid: (v) => `${currency} ${v}`,
      intlFallback: (num) => `${currency} ${num}`,
      cjk: (num, _languageSubtag) =>
        `${currency || getLanguageConfig(getLocale())?.currency || ''}${formatCardinal(num)}`,
      arabicFallback: (num) => `${currency} ${NATIVE_DIGITS_MAP.ar(num)}`,
      devanagariFallback: (num) => `${currency} ${NATIVE_DIGITS_MAP.hi(num)}`,
      cyrillicFallback: (num) => `${currency} ${NATIVE_DIGITS_MAP.ru(num)}`,
    },
  );
};

export const formatPercent = (value: number | string, options: FormatOptions = {}) => {
  return processNumeric(
    value,
    options,
    { style: 'percent' },
    {
      invalid: (v) => `${v}%`,
      intlFallback: (num) => `${num * 100}%`,
      cjk: (num, _languageSubtag) => `${formatCardinal(Math.round(num * 100))}%`,
      arabicFallback: (num) => `${NATIVE_DIGITS_MAP.ar(Math.round(num * 100))}%`,
      devanagariFallback: (num) => `${NATIVE_DIGITS_MAP.hi(Math.round(num * 100))}%`,
      cyrillicFallback: (num) => `${NATIVE_DIGITS_MAP.ru(Math.round(num * 100))}%`,
    },
  );
};

export const formatUnit = (value: number | string, unit: string, options: FormatOptions = {}) => {
  return processNumeric(
    value,
    options,
    { style: 'unit', unit, unitDisplay: 'short' },
    {
      invalid: (v) => `${v} ${unit}`,
      intlFallback: (num) => `${num} ${unit}`,
      cjk: (num, _languageSubtag) => `${formatCardinal(num)}${unit}`,
      arabicFallback: (num) => `${NATIVE_DIGITS_MAP.ar(num)} ${unit}`,
      devanagariFallback: (num) => `${NATIVE_DIGITS_MAP.hi(num)} ${unit}`,
      cyrillicFallback: (num) => `${NATIVE_DIGITS_MAP.ru(num)} ${unit}`,
    },
  );
};

export const formatScientific = (value: number | string, options: FormatOptions = {}) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  const numberingSystem = options.numberingSystem ?? getNumberingSystem(options);

  if (num === 0) {
    if (numberingSystem === 'arab') return '٠';
    if (numberingSystem === 'deva') return '०';
    if (ALGORITHMIC_SYSTEMS.includes(numberingSystem as (typeof ALGORITHMIC_SYSTEMS)[number])) {
      const nsConfig = ACTIVE_NUMBERING_SYSTEMS.find((ns) => ns.code === numberingSystem);
      if (nsConfig?.digits) return nsConfig.digits[0];
    }
    return '0';
  }

  return processNumeric(
    value,
    options,
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 6,
      notation: 'scientific',
    },
    {
      invalid: String,
      intlFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        let expStr: string;
        if (numberingSystem === 'arab') {
          expStr = ` × ١٠${Math.abs(exp)}`;
        } else if (numberingSystem === 'deva') {
          expStr = ` × १०${Math.abs(exp)}`;
        } else {
          expStr = `×10${Math.abs(exp)}`;
        }
        return `${n < 0 ? '-' : ''}${(Math.abs(n) / 10 ** exp).toFixed(exp === 0 ? 0 : 1)}${expStr}`;
      },
      cjk: (n, languageSubtag) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        const cMan = formatCardinal(Math.abs(n) / 10 ** exp);
        const cExp = formatCardinal(10 ** Math.abs(exp));
        const minus = n < 0 ? (languageSubtag === 'ja' ? 'マイナス' : '负') : '';
        return `${minus}${cMan}×${cExp}`;
      },
      arabicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${NATIVE_DIGITS_MAP.ar((Math.abs(n) / 10 ** exp).toFixed(1))}×١٠${NATIVE_DIGITS_MAP.ar(Math.abs(exp))}`;
      },
      devanagariFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '-' : ''}${NATIVE_DIGITS_MAP.hi((Math.abs(n) / 10 ** exp).toFixed(1))}×१०${NATIVE_DIGITS_MAP.hi(Math.abs(exp))}`;
      },
      cyrillicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${NATIVE_DIGITS_MAP.ru((Math.abs(n) / 10 ** exp).toFixed(1))}×¹⁰${NATIVE_DIGITS_MAP.ru(Math.abs(exp))}`;
      },
    },
  );
};

export const formatBytes = (bytes: number, decimals: number = 1) => {
  if (bytes < 0) bytes = Math.abs(bytes);
  if (!Number.isFinite(bytes)) return String(bytes);
  if (bytes === 0) {
    try {
      return new Intl.NumberFormat(getLocale(), {
        style: 'unit',
        unit: 'byte',
      }).format(0);
    } catch {
      return '0 B';
    }
  }

  const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];
  const k = 1_024;
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
  const scaled = bytes / k ** i;

  try {
    return new Intl.NumberFormat(getLocale(), {
      style: 'unit',
      unit: units[Math.min(i, units.length - 1)],
      maximumFractionDigits: Math.max(0, decimals),
    }).format(scaled);
  } catch {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    return `${parseFloat(scaled.toFixed(Math.max(0, decimals)))} ${sizes[Math.min(i, sizes.length - 1)]}`;
  }
};

export const formatAbbreviated = (value: number, options: FormatOptions = {}) => {
  try {
    return new Intl.NumberFormat(getLocale(), {
      notation: 'compact',
      ...options,
    }).format(value);
  } catch {
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3) | 0;
    if (tier === 0) return formatNumber(value, options);

    const suffix = ['', 'K', 'M', 'B', 'T'][tier];
    const scaled = value / 10 ** (tier * 3);
    let decimals: number;
    if (scaled % 1 === 0) {
      decimals = 0;
    } else if (scaled % 0.1 === 0) {
      decimals = 1;
    } else {
      decimals = 2;
    }

    return (
      formatNumber(scaled, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
        ...options,
      }) + suffix
    );
  }
};

const formatIntlDate = (date: DateValue, options?: Intl.DateTimeFormatOptions) => {
  try {
    const config = getLanguageConfig(getLocale());
    return new Intl.DateTimeFormat(getLocale(), {
      timeZone: config?.timezone,
      calendar: config?.calendar,
      ...options,
    }).format(toDateObj(date));
  } catch {
    return String(date);
  }
};

export const formatDate = (date: DateValue, options?: Intl.DateTimeFormatOptions) => formatIntlDate(date, options);

export const formatTime = (date: DateValue, options?: TimeFormatOptions) =>
  formatIntlDate(date, { timeStyle: options?.timeStyle ?? 'short' });

export const formatDateTime = (date: DateValue, options?: Intl.DateTimeFormatOptions) =>
  formatIntlDate(date, {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  });

export const formatDuration = (seconds: number, options?: DurationOptions) => {
  try {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), {
      numeric: options?.numeric ?? 'auto',
      ...options,
    });

    const h = Math.floor(seconds / 3_600);
    const m = Math.floor((seconds % 3_600) / 60);
    const s = seconds % 60;

    const parts = [
      ...(h > 0 ? [rtf.format(h, 'hour')] : []),
      ...(m > 0 ? [rtf.format(m, 'minute')] : []),
      ...(s > 0 || (h === 0 && m === 0) ? [rtf.format(s, 'second')] : []),
    ];

    return new Intl.ListFormat(getLocale(), {
      style: 'short',
      type: 'conjunction',
    }).format(parts);
  } catch {
    return `${seconds}s`;
  }
};

export const formatList = (items: string[], options?: ListFormatOptions) => {
  try {
    return new Intl.ListFormat(getLocale(), {
      style: options?.style ?? 'long',
      type: options?.type ?? 'conjunction',
      ...options,
    }).format(items);
  } catch {
    return items.join(', ');
  }
};

export const localPrice = (plan: RegionalPrice): number => {
  const locale = getLocale();
  const currency = getCurrency(locale);
  const priceKey = `price_${currency.toLowerCase()}`;

  if (!plan?.prices) {
    return 0;
  }

  if (priceKey in plan.prices) {
    return plan.prices[priceKey] as number;
  }

  return plan.prices.price_usd;
};

export const localPriceCurrency = (_plan: RegionalPrice) => {
  return getCurrency(getLocale());
};

export const convertCurrency = (value: number, targetCurrency?: string, options?: FormatOptions) => {
  const currency = targetCurrency || getCurrency(getLocale());
  const converted = convertCurrencyRaw(value, getCurrency(getLocale()), currency, EXCHANGE_RATES);

  return formatCurrency(converted, currency, options);
};

export const convertLocalPrice = (plan: RegionalPrice, targetCurrency?: CurrencyCode, options?: FormatOptions) => {
  const price = localPrice(plan);
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency = targetCurrency || getCurrency(getLocale());

  if (fromCurrency === toCurrency) {
    return formatCurrency(price, toCurrency, options);
  }

  const converted = convertCurrencyRaw(price, fromCurrency, toCurrency, EXCHANGE_RATES);

  return formatCurrency(converted, toCurrency, options);
};

export const formatLocalPrice = (plan: RegionalPrice, options?: FormatOptions) => {
  const price = localPrice(plan);
  const currency = localPriceCurrency(plan);

  return formatCurrency(price, currency, options);
};

export const formatLocalPriceDiscounted = (
  plan: RegionalPrice,
  discountMultiplier: number,
  targetCurrency?: CurrencyCode,
  options?: FormatOptions,
) => {
  const price = localPrice(plan) * discountMultiplier;
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency = targetCurrency || getCurrency(getLocale());

  if (fromCurrency === toCurrency) {
    return formatCurrency(price, toCurrency, options);
  }

  const converted = convertCurrencyRaw(price, fromCurrency, toCurrency, EXCHANGE_RATES);

  return formatCurrency(converted, toCurrency, options);
};

export const plural = (word: string, count?: number, inclusive = false) =>
  count === undefined ? pluralize(word) : pluralize(word, count, inclusive);

export const singular = (word: string) => pluralize.singular(word);

export const formatRelativeTime = (value: number, options: RelativeTimeOptions) => {
  const lang = getLocale();
  try {
    return new Intl.RelativeTimeFormat(lang, {
      numeric: options.numeric ?? 'auto',
    }).format(value, options.unit);
  } catch {
    return `${value} ${options.unit}`;
  }
};
