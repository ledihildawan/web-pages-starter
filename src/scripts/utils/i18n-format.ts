import pluralize from 'pluralize';
import {
  convertCurrency as convertCurrencyRaw,
  EXCHANGE_RATES,
} from '../../../generated/exchange-rates';
import {
  BASE_CURRENCY,
  type CurrencyCode,
} from '../../configs/locales/currencies';
import { LOCALES } from '../../configs/locales/data';
import { LANGUAGE_CODE } from '../../configs/locales/languages';
import {
  NUMBERING_SYSTEM_CODE,
  NUMBERING_SYSTEMS,
} from '../../configs/locales/numbering-systems';
import { WRITING_SYSTEM } from '../../configs/locales/writing-systems';
import type {
  CardinalOptions,
  DateValue,
  DurationOptions,
  FormatOptions,
  ListFormatOptions,
  OrdinalOptions,
  RegionalPrice,
  RelativeTimeOptions,
  TimeFormatOptions,
} from '../../types/common';
import { toDateObj } from './common';
import {
  getCurrency,
  getLanguageConfig,
  getLanguageSubtag,
  getLocale,
} from './locale';

const createDigitConverter =
  (digitsArray: readonly string[]) => (num: number | string) =>
    String(num).replace(/\d/g, (d) => digitsArray[Number(d)]);

const NATIVE_DIGITS_MAP = LOCALES.reduce(
  (acc, locale) => {
    const lang = locale.language;
    const ns = locale.nativeNumberingSystem;

    if (acc[lang]) return acc;

    const nsConfig = NUMBERING_SYSTEMS.find((config) => config.code === ns);
    if (nsConfig?.digits) {
      acc[lang] = createDigitConverter(nsConfig.digits);
    }

    return acc;
  },
  {} as Record<string, (num: number | string) => string>,
);

const getNumberingSystem = (options: FormatOptions = {}) =>
  options.nativeDigits
    ? getLanguageConfig(getLocale())?.nativeNumberingSystem ||
      NUMBERING_SYSTEM_CODE.LATN
    : options.numberingSystem ||
      getLanguageConfig(getLocale())?.numberingSystem ||
      NUMBERING_SYSTEM_CODE.LATN;

export const getNativeNumberingSystem = () =>
  getLanguageConfig(getLocale())?.nativeNumberingSystem ||
  NUMBERING_SYSTEM_CODE.LATN;

export const toNativeDigits = (text: string, force?: boolean) => {
  if (force === false) return text;

  const localeConfig = getLanguageConfig(getLocale());
  const shouldConvert =
    force === true || (force === undefined && localeConfig?.nativeDigits);

  if (!shouldConvert) return text;

  try {
    const formatter = new Intl.NumberFormat(getLocale(), {
      numberingSystem:
        localeConfig?.nativeNumberingSystem || NUMBERING_SYSTEM_CODE.LATN,
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

const safeIntlFormat = (
  options: Intl.NumberFormatOptions,
  num: number,
  fallback: string,
) => {
  try {
    return new Intl.NumberFormat(getLocale(), options).format(num);
  } catch {
    return fallback;
  }
};

type CardinalRule = {
  limit: number;
  div?: number;
  format: (
    n: number,
    q: number,
    r: number,
    rec: (val: number) => string,
  ) => string;
};

const buildCardinal = (
  zeroStr: string,
  negativeFmt: (val: string) => string,
  rules: CardinalRule[],
) => {
  const formatter = (num: number): string => {
    if (num === 0) return zeroStr;
    if (num < 0) return negativeFmt(formatter(Math.abs(num)));

    for (const { limit, div, format } of rules) {
      if (num < limit)
        return format(
          num,
          Math.floor(num / (div ?? 1)),
          num % (div ?? 1),
          formatter,
        );
    }
    return `${num}`;
  };
  return formatter;
};

const indonesianCardinal = buildCardinal('nol', (s) => `minus ${s}`, [
  {
    limit: 11,
    format: (n) =>
      [
        '',
        'satu',
        'dua',
        'tiga',
        'empat',
        'lima',
        'enam',
        'tujuh',
        'delapan',
        'sembilan',
        'sepuluh',
      ][n],
  },
  {
    limit: 20,
    format: (n) =>
      [
        'sepuluh',
        'sebelas',
        'dua belas',
        'tiga belas',
        'empat belas',
        'lima belas',
        'enam belas',
        'tujuh belas',
        'delapan belas',
        'sembilan belas',
      ][n - 10],
  },
  {
    limit: 100,
    div: 10,
    format: (_, q, r, rec) =>
      r
        ? `${['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'][q]} ${rec(r)}`
        : [
            '',
            '',
            'dua puluh',
            'tiga puluh',
            'empat puluh',
            'lima puluh',
            'enam puluh',
            'tujuh puluh',
            'delapan puluh',
            'sembilan puluh',
          ][q],
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => {
      if (r) {
        const prefix = q === 1 ? 'seratus' : `${rec(q)} ratus`;
        return `${prefix} ${rec(r)}`;
      }
      return q === 1 ? 'seratus' : `${rec(q)} ratus`;
    },
  },
  {
    limit: 1_000_000,
    div: 1_000,
    format: (_, q, r, rec) => {
      if (r) {
        const prefix = q === 1 ? 'seribu' : `${rec(q)} ribu`;
        return `${prefix} ${rec(r)}`;
      }
      return q === 1 ? 'seribu' : `${rec(q)} ribu`;
    },
  },
  {
    limit: 1_000_000_000,
    div: 1_000_000,
    format: (_, q, r, rec) =>
      r ? `${rec(q)} juta ${rec(r)}` : `${rec(q)} juta`,
  },
  {
    limit: 1_000_000_000_000,
    div: 1_000_000_000,
    format: (_, q, r, rec) =>
      r ? `${rec(q)} miliar ${rec(r)}` : `${rec(q)} miliar`,
  },
]);

const jpDigits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const jpUnits = ['', '十', '百', '千', '万', '億', '兆'];

const japaneseCardinal = buildCardinal('〇', (s) => `マイナス${s}`, [
  { limit: 10, format: (n) => jpDigits[n] },
  {
    limit: 100,
    div: 10,
    format: (_, q, r) =>
      (q === 1 ? '' : jpDigits[q]) + jpUnits[1] + (r ? jpDigits[r] : ''),
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) =>
      (q === 1 ? '' : jpDigits[q]) + jpUnits[2] + (r ? rec(r) : ''),
  },
  {
    limit: 10_000,
    div: 1_000,
    format: (_, q, r, rec) =>
      (q === 1 ? '' : jpDigits[q]) + jpUnits[3] + (r ? rec(r) : ''),
  },
  {
    limit: 100_000_000,
    div: 10_000,
    format: (_, q, r, rec) => rec(q) + jpUnits[4] + (r ? rec(r) : ''),
  },
  {
    limit: 1_000_000_000_000,
    div: 100_000_000,
    format: (_, q, r, rec) => rec(q) + jpUnits[5] + (r ? rec(r) : ''),
  },
]);

const zhDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const zhUnits = ['', '十', '百', '千', '万', '亿'];

const chineseCardinal = buildCardinal('〇', (s) => `负${s}`, [
  { limit: 10, format: (n) => zhDigits[n] },
  {
    limit: 20,
    div: 10,
    format: (n, _, r) => zhUnits[1] + (n > 10 ? zhDigits[r] : ''),
  },
  {
    limit: 100,
    div: 10,
    format: (_, q, r) => zhDigits[q] + zhUnits[1] + (r ? zhDigits[r] : ''),
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => zhDigits[q] + zhUnits[2] + (r ? rec(r) : ''),
  },
  {
    limit: 10_000,
    div: 1_000,
    format: (_, q, r, rec) => zhDigits[q] + zhUnits[3] + (r ? rec(r) : ''),
  },
  {
    limit: 100_000_000,
    div: 10_000,
    format: (_, q, r, rec) => rec(q) + zhUnits[4] + (r ? rec(r) : ''),
  },
  {
    limit: 1_000_000_000_000,
    div: 100_000_000,
    format: (_, q, r, rec) => rec(q) + zhUnits[5] + (r ? rec(r) : ''),
  },
]);

const arabicCardinal = buildCardinal('صِفْر', (s) => `سالب ${s}`, [
  {
    limit: 11,
    format: (n) =>
      [
        '',
        'واحِد',
        'اِثنان',
        'ثَلاثة',
        'أرْبَعَة',
        'خَمْة',
        'سِتَّة',
        'سَبْعَة',
        'ثَمانِية',
        'تِسْعة',
        'عَشرة',
      ][n],
  },
  {
    limit: 20,
    format: (n) =>
      [
        '',
        'أحدَ عشر',
        'اِثنا عشر',
        'ثَلاثة عشر',
        'أربَعة عشر',
        'خَمسة عشر',
        'سِتَّة عشر',
        'سَبعَة عشر',
        'ثَمانية عشر',
        'تِسعة عشر',
      ][n - 10],
  },
  {
    limit: 100,
    div: 10,
    format: (_, q, r) => {
      const tens = [
        '',
        'عشرون',
        'ثَلاثون',
        'أربَعون',
        'خَمسون',
        'سِتّون',
        'سِبعون',
        'ثَمانون',
        'تِسعون',
      ];
      return r === 0
        ? tens[q]
        : `${['', 'واحِد', 'اِثنان', 'ثَلاثة', 'أرْبَعَة', 'خَمْة', 'سِتَّة', 'سَبْعَة', 'ثَمانِية', 'تِسْعة'][r]} و${tens[q]}`;
    },
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => {
      if (r) {
        const prefix = q === 1 ? 'مِئة' : `${rec(q)} مِئة`;
        return `${prefix} و${rec(r)}`;
      }
      return q === 1 ? 'مِئة' : `${rec(q)} مِئة`;
    },
  },
  {
    limit: 1_000_000,
    div: 1_000,
    format: (_, q, r, rec) => {
      let tw: string;
      if (q === 1) {
        tw = 'ألف';
      } else if (q === 2) {
        tw = 'ألفان';
      } else if (q > 2 && q < 11) {
        tw = `${rec(q)} آلاف`;
      } else {
        tw = `${rec(q)} ألف`;
      }
      return r ? `${tw} و${rec(r)}` : tw;
    },
  },
]);

const CARDINAL_STRATEGY: Record<string, (num: number) => string> = {
  id: indonesianCardinal,
  ja: japaneseCardinal,
  zh: chineseCardinal,
  ar: arabicCardinal,
};

export const formatCardinal = (
  value: number | string,
  _options?: CardinalOptions,
) => {
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return `${value}`;
  return CARDINAL_STRATEGY[getLanguageSubtag(getLocale())]?.(num) ?? `${num}`;
};

const ORDINAL_STRATEGY: Record<string, (num: number) => string> = {
  id: (num) =>
    num < 11
      ? [
          'ke-',
          'kesatu',
          'kedua',
          'ketiga',
          'keempat',
          'kelima',
          'keenam',
          'ketujuh',
          'kedelapan',
          'kesembilan',
          'kesepuluh',
        ][num]
      : `ke-${num}`,
  ja: (num) => `第${num < 1 ? num : japaneseCardinal(num)}`,
  ar: (num) => {
    if (num < 1) return `${num}`;
    if (num < 11)
      return [
        '',
        'أول',
        'ثان',
        'ثالث',
        'رابع',
        'خامس',
        'سادس',
        'سابع',
        'ثامن',
        'تاسع',
        'عاشر',
      ][num];
    if (num < 20)
      return [
        '',
        'الحادي عشر',
        'الثاني عشر',
        'الثالث عشر',
        'الرابع عشر',
        'الخامس عشر',
        'السادس عشر',
        'السابع عشر',
        'الثامن عشر',
        'التاسع عشر',
      ][num - 10];
    if (num < 100) {
      const tens = [
        '',
        'العشرون',
        'الثلاثون',
        'الأربعون',
        'الخمسون',
        'الستون',
        'السبعون',
        'الثمانون',
        'التسعون',
      ];
      const rem = num % 10;
      if (rem === 0) return tens[Math.floor(num / 10)];
      if (rem === 1) return `الحادي و${tens[Math.floor(num / 10)]}`;
      if (rem === 2) return `الثاني و${tens[Math.floor(num / 10)]}`;
      return `${['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'][rem]} و${tens[Math.floor(num / 10)]}`;
    }
    return `ال${arabicCardinal(num)}`;
  },
};

export const formatOrdinal = (
  value: number | string,
  _options?: OrdinalOptions,
) => {
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return `${value}`;

  const code = getLanguageSubtag(getLocale());
  if (ORDINAL_STRATEGY[code]) return ORDINAL_STRATEGY[code](num);

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
    const suffix =
      ordinalSuffixes[category]?.[getLanguageSubtag(getLocale())] ??
      ordinalSuffixes[category]?.en ??
      'th';
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

  if (options.nativeDigits) {
    const cjkLanguages = WRITING_SYSTEM.CJK_LANGUAGES as readonly string[];
    if (config.cjk && cjkLanguages.includes(languageSubtag))
      return config.cjk(num, languageSubtag);

    const digitRules: {
      languages: readonly string[];
      converter: (num: number | string) => string;
      fallback: (num: number) => string;
    }[] = [
      {
        languages: WRITING_SYSTEM.ARABIC_LANGUAGES as readonly string[],
        converter: NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR],
        fallback: config.arabicFallback,
      },
      {
        languages: WRITING_SYSTEM.DEVANAGARI_LANGUAGES as readonly string[],
        converter: NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI],
        fallback: config.devanagariFallback,
      },
      {
        languages: WRITING_SYSTEM.CYRILLIC_LANGUAGES as readonly string[],
        converter: NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU],
        fallback: config.cyrillicFallback,
      },
    ];

    const matchedRule = digitRules.find((rule) =>
      rule.languages.includes(languageSubtag),
    );

    if (matchedRule) {
      const intlResult = safeIntlFormat(
        { ...intlOptions, ...options },
        num,
        '',
      );

      return intlResult
        ? matchedRule.converter(intlResult)
        : matchedRule.fallback(num);
    }
  }

  return safeIntlFormat(
    {
      ...intlOptions,
      numberingSystem: options.numberingSystem ?? getNumberingSystem(options),
      ...options,
    },
    num,
    config.intlFallback(num),
  );
};

export const formatNumber = (
  value: number | string,
  options: FormatOptions = {},
) =>
  processNumeric(
    value,
    options,
    {},
    {
      invalid: String,
      intlFallback: String,
      cjk: (num, _languageSubtag) => formatCardinal(num),
      arabicFallback: NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR],
      devanagariFallback: NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI],
      cyrillicFallback: NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU],
    },
  );

export const formatCurrency = (
  value: number | string,
  currency: string,
  options: FormatOptions = {},
) => {
  return processNumeric(
    value,
    options,
    { style: 'currency', currency },
    {
      invalid: (v) => `${currency} ${v}`,
      intlFallback: (num) => `${currency} ${num}`,
      cjk: (num, _languageSubtag) =>
        `${currency || getLanguageConfig(getLocale())?.currency || ''}${formatCardinal(num)}`,
      arabicFallback: (num) =>
        `${currency} ${NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR](num)}`,
      devanagariFallback: (num) =>
        `${currency} ${NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI](num)}`,
      cyrillicFallback: (num) =>
        `${currency} ${NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU](num)}`,
    },
  );
};

export const formatPercent = (
  value: number | string,
  options: FormatOptions = {},
) => {
  return processNumeric(
    value,
    options,
    { style: 'percent' },
    {
      invalid: (v) => `${v}%`,
      intlFallback: (num) => `${num * 100}%`,
      cjk: (num, _languageSubtag) =>
        `${formatCardinal(Math.round(num * 100))}%`,
      arabicFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR](Math.round(num * 100))}%`,
      devanagariFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI](Math.round(num * 100))}%`,
      cyrillicFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU](Math.round(num * 100))}%`,
    },
  );
};

export const formatUnit = (
  value: number | string,
  unit: string,
  options: FormatOptions = {},
) => {
  return processNumeric(
    value,
    options,
    { style: 'unit', unit, unitDisplay: 'short' },
    {
      invalid: (v) => `${v} ${unit}`,
      intlFallback: (num) => `${num} ${unit}`,
      cjk: (num, _languageSubtag) => `${formatCardinal(num)}${unit}`,
      arabicFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR](num)} ${unit}`,
      devanagariFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI](num)} ${unit}`,
      cyrillicFallback: (num) =>
        `${NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU](num)} ${unit}`,
    },
  );
};

export const formatScientific = (
  value: number | string,
  options: FormatOptions = {},
) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  const numberingSystem = getNumberingSystem(options);

  if (num === 0) {
    if (numberingSystem === NUMBERING_SYSTEM_CODE.ARAB) return '٠';
    if (numberingSystem === NUMBERING_SYSTEM_CODE.DEVA) return '०';
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
        const minus =
          n < 0
            ? languageSubtag === LANGUAGE_CODE.JA
              ? 'マイナス'
              : '负'
            : '';
        return `${minus}${cMan}×${cExp}`;
      },
      arabicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR]((Math.abs(n) / 10 ** exp).toFixed(1))}×١٠${NATIVE_DIGITS_MAP[LANGUAGE_CODE.AR](Math.abs(exp))}`;
      },
      devanagariFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '-' : ''}${NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI]((Math.abs(n) / 10 ** exp).toFixed(1))}×१०${NATIVE_DIGITS_MAP[LANGUAGE_CODE.HI](Math.abs(exp))}`;
      },
      cyrillicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU]((Math.abs(n) / 10 ** exp).toFixed(1))}×¹⁰${NATIVE_DIGITS_MAP[LANGUAGE_CODE.RU](Math.abs(exp))}`;
      },
    },
  );
};

export const formatBytes = (bytes: number, decimals: number = 1) => {
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

  const units = [
    'byte',
    'kilobyte',
    'megabyte',
    'gigabyte',
    'terabyte',
    'petabyte',
  ];
  const k = 1_024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
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

export const formatAbbreviated = (
  value: number,
  options: FormatOptions = {},
) => {
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

const formatIntlDate = (
  date: DateValue,
  options?: Intl.DateTimeFormatOptions,
) => {
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

export const formatDate = (
  date: DateValue,
  options?: Intl.DateTimeFormatOptions,
) => formatIntlDate(date, options);

export const formatTime = (date: DateValue, options?: TimeFormatOptions) =>
  formatIntlDate(date, { timeStyle: options?.timeStyle ?? 'short' });

export const formatDateTime = (
  date: DateValue,
  options?: Intl.DateTimeFormatOptions,
) =>
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

  if (!plan?.pricing) {
    return 0;
  }

  if (plan.pricing[locale]) {
    return plan.pricing[locale];
  }

  return plan.pricing.base;
};

export const localPriceCurrency = (plan: RegionalPrice) => {
  const locale = getLocale();

  if (!plan?.pricing) {
    return BASE_CURRENCY;
  }

  if (plan.pricing[locale]) {
    return getCurrency(locale);
  }

  return BASE_CURRENCY;
};

export const convertCurrency = (
  value: number,
  targetCurrency?: string,
  options?: FormatOptions,
) => {
  const currency =
    targetCurrency ||
    LOCALES.find((l) => l.code === getLocale())?.currency ||
    BASE_CURRENCY;
  const converted = convertCurrencyRaw(
    value,
    BASE_CURRENCY,
    currency,
    EXCHANGE_RATES,
  );

  return formatCurrency(converted, currency, options);
};

export const convertLocalPrice = (
  plan: { pricing: { base: number; [locale: string]: number } },
  targetCurrency?: CurrencyCode,
  options?: FormatOptions,
) => {
  const price = localPrice(plan);
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency =
    targetCurrency ||
    LOCALES.find((l) => l.code === getLocale())?.currency ||
    BASE_CURRENCY;

  if (fromCurrency === toCurrency) {
    return formatCurrency(price, toCurrency, options);
  }

  const converted = convertCurrencyRaw(
    price,
    fromCurrency,
    toCurrency,
    EXCHANGE_RATES,
  );

  return formatCurrency(converted, toCurrency, options);
};

export const formatLocalPrice = (
  plan: {
    pricing: { base: number; [locale: string]: number };
  },
  options?: FormatOptions,
) => {
  const price = localPrice(plan);
  const currency = localPriceCurrency(plan);

  return formatCurrency(price, currency, options);
};

export const formatLocalPriceDiscounted = (
  plan: { pricing: { base: number; [locale: string]: number } },
  discountMultiplier: number,
  targetCurrency?: CurrencyCode,
  options?: FormatOptions,
) => {
  const price = localPrice(plan) * discountMultiplier;
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency =
    targetCurrency ||
    LOCALES.find((l) => l.code === getLocale())?.currency ||
    BASE_CURRENCY;

  if (fromCurrency === toCurrency) {
    return formatCurrency(price, toCurrency, options);
  }

  const converted = convertCurrencyRaw(
    price,
    fromCurrency,
    toCurrency,
    EXCHANGE_RATES,
  );

  return formatCurrency(converted, toCurrency, options);
};

export const plural = (word: string, count?: number, inclusive = false) => {
  if (inclusive && count !== undefined) return pluralize(word, count);
  return count === undefined ? pluralize(word) : pluralize(word, count);
};

export const singular = (word: string) => pluralize.singular(word);

export const formatRelativeTime = (
  value: number,
  options: RelativeTimeOptions,
) => {
  const lang = getLocale();
  try {
    return new Intl.RelativeTimeFormat(lang, {
      numeric: options.numeric ?? 'auto',
    }).format(value, options.unit);
  } catch {
    return `${value} ${options.unit}`;
  }
};
