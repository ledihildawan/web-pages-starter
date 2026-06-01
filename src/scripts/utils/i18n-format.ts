import pluralize from 'pluralize';
import {
  convertCurrency as convertCurrencyRaw,
  EXCHANGE_RATES,
} from '../../../generated/exchange-rates';
import {
  ARABIC_LANGUAGES,
  BASE_CURRENCY,
  CJK_LANGUAGES,
  CYRILLIC_LANGUAGES,
  DEVANAGARI_LANGUAGES,
  LANGUAGE,
  type LanguageCode,
  LOCALES,
} from '../../configs/locales';
import type {
  CardinalOptions,
  DateTimePreset,
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
  getLangCode,
  getLanguageConfig,
  getLocale,
} from './locale';

const ARABIC_INDIC_DIGITS: readonly string[] = [
  '٠',
  '١',
  '٢',
  '٣',
  '٤',
  '٥',
  '٦',
  '٧',
  '٨',
  '٩',
];

const DEVANAGARI_DIGITS: readonly string[] = [
  '०',
  '१',
  '२',
  '३',
  '४',
  '५',
  '६',
  '७',
  '८',
  '९',
];

const JP_DIGITS: readonly string[] = [
  '〇',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
];

const ZH_DIGITS: readonly string[] = [
  '〇',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
];

const KO_DIGITS: readonly string[] = [
  '영',
  '일',
  '이',
  '삼',
  '사',
  '오',
  '육',
  '칠',
  '팔',
  '구',
];

const RU_DIGITS: readonly string[] = [
  '⁰',
  '¹',
  '²',
  '³',
  '⁴',
  '⁵',
  '⁶',
  '⁷',
  '⁸',
  '⁹',
];

const getNumberingSystem = (options: FormatOptions = {}): string =>
  options.nativeDigits
    ? getLanguageConfig(getLocale())?.nativeNumberingSystem || 'latn'
    : options.numberingSystem ||
    getLanguageConfig(getLocale())?.numberingSystem ||
    'latn';

export const getNativeNumberingSystem = (): string =>
  getLanguageConfig(getLocale())?.nativeNumberingSystem || 'latn';

const toArabicIndicDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);

const toDevanagariDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);

const toJapaneseDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => JP_DIGITS[Number(d)]);

const toChineseDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => ZH_DIGITS[Number(d)]);

const toKoreanDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => KO_DIGITS[Number(d)]);

const toRussianDigits = (num: number | string): string =>
  String(num).replace(/\d/g, (d) => RU_DIGITS[Number(d)]);

const NATIVE_DIGITS_MAP: Record<string, (num: number | string) => string> = {
  ar: toArabicIndicDigits,
  ja: toJapaneseDigits,
  zh: toChineseDigits,
  hi: toDevanagariDigits,
  ko: toKoreanDigits,
  ru: toRussianDigits,
};

export const toNativeDigits = (text: string, force?: boolean): string => {
  if (force === false) return text;

  const localeConfig = getLanguageConfig(getLocale());
  const shouldConvert =
    force === true || (force === undefined && localeConfig?.nativeDigits);

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
  } catch { }

  const langCode = getLangCode(getLocale());
  const converter = NATIVE_DIGITS_MAP[langCode];
  return converter ? converter(text) : text;
};

const safeIntlFormat = (
  options: Intl.NumberFormatOptions,
  num: number,
  fallback: string,
): string => {
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
    format: (_, q, r, rec) =>
      r
        ? `${q === 1 ? 'seratus' : `${rec(q)} ratus`} ${rec(r)}`
        : q === 1
          ? 'seratus'
          : `${rec(q)} ratus`,
  },
  {
    limit: 1_000_000,
    div: 1_000,
    format: (_, q, r, rec) =>
      r
        ? `${q === 1 ? 'seribu' : `${rec(q)} ribu`} ${rec(r)}`
        : q === 1
          ? 'seribu'
          : `${rec(q)} ribu`,
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
    format: (_, q, r, rec) =>
      r
        ? `${q === 1 ? 'مِئة' : `${rec(q)} مِئة`} و${rec(r)}`
        : q === 1
          ? 'مِئة'
          : `${rec(q)} مِئة`,
  },
  {
    limit: 1_000_000,
    div: 1_000,
    format: (_, q, r, rec) => {
      const tw =
        q === 1
          ? 'ألف'
          : q === 2
            ? 'ألفان'
            : q > 2 && q < 11
              ? `${rec(q)} آلاف`
              : `${rec(q)} ألف`;
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
): string => {
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return `${value}`;
  return CARDINAL_STRATEGY[getLangCode(getLocale())]?.(num) ?? `${num}`;
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
  zh: (num) => `第${num < 1 ? num : chineseCardinal(num)}`,
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
  fr: (num) => {
    if (num === 1) return `${num}er`;
    return `${num}e`;
  },
  es: (num) => `${num}.º`,
  pt: (num) => `${num}.º`,
  de: (num) => `${num}.`,
  ru: (num) => `${num}-й`,
  ko: (num) => `제${num}`,
  hi: (num) => `${num}वाँ`,
};

export const formatOrdinal = (
  value: number | string,
  _options?: OrdinalOptions,
): string => {
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return `${value}`;

  const code = getLangCode(getLocale());
  if (ORDINAL_STRATEGY[code]) return ORDINAL_STRATEGY[code](num);

  try {
    const sfx = new Intl.PluralRules(getLocale(), { type: 'ordinal' }).select(
      num,
    );
    const suffixMap: Record<string, string> = {
      one: 'st',
      two: 'nd',
      few: 'rd',
      other: 'th',
      zero: 'th',
      many: 'th',
    };
    return `${num}${suffixMap[sfx] ?? 'th'}`;
  } catch {
    const rem = num % 100;
    if (rem >= 11 && rem <= 13) return `${num}th`;
    return `${num}${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][num % 10] ?? 'th'}`;
  }
};

interface FormatterConfigs {
  invalid: (val: string | number) => string;
  intlFallback: (num: number) => string;
  cjk?: (num: number, _langCode?: string) => string;
  arabicFallback: (num: number) => string;
  devanagariFallback: (num: number) => string;
  cyrillicFallback: (num: number) => string;
}

const processNumeric = (
  value: number | string,
  options: FormatOptions,
  intlOptions: Intl.NumberFormatOptions,
  config: FormatterConfigs,
): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return config.invalid(value);

  const langCode = getLangCode(getLocale());

  if (options.nativeDigits) {
    if (config.cjk && CJK_LANGUAGES.includes(langCode as LanguageCode)) {
      return config.cjk(num, langCode);
    }
    if (ARABIC_LANGUAGES.includes(langCode as LanguageCode)) {
      const intlResult = safeIntlFormat(
        { ...intlOptions, ...options },
        num,
        '',
      );
      return intlResult
        ? toArabicIndicDigits(intlResult)
        : config.arabicFallback(num);
    }
    if (DEVANAGARI_LANGUAGES.includes(langCode as LanguageCode)) {
      const intlResult = safeIntlFormat(
        { ...intlOptions, ...options },
        num,
        '',
      );
      return intlResult
        ? toDevanagariDigits(intlResult)
        : config.devanagariFallback(num);
    }
    if (CYRILLIC_LANGUAGES.includes(langCode as LanguageCode)) {
      const intlResult = safeIntlFormat(
        { ...intlOptions, ...options },
        num,
        '',
      );
      return intlResult
        ? toRussianDigits(intlResult)
        : config.cyrillicFallback(num);
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
): string =>
  processNumeric(
    value,
    options,
    {},
    {
      invalid: String,
      intlFallback: String,
      cjk: (num, _langCode) => formatCardinal(num),
      arabicFallback: toArabicIndicDigits,
      devanagariFallback: toDevanagariDigits,
      cyrillicFallback: toRussianDigits,
    },
  );

export const formatCurrency = (
  value: number | string,
  currency: string,
  options: FormatOptions = {},
): string => {
  return processNumeric(
    value,
    options,
    { style: 'currency', currency },
    {
      invalid: (v) => `${currency} ${v}`,
      intlFallback: (num) => `${currency} ${num}`,
      cjk: (num, _langCode) =>
        `${currency || getLanguageConfig(getLocale())?.currency || ''}${formatCardinal(num)}`,
      arabicFallback: (num) => `${currency} ${toArabicIndicDigits(num)}`,
      devanagariFallback: (num) => `${currency} ${toDevanagariDigits(num)}`,
      cyrillicFallback: (num) => `${currency} ${toRussianDigits(num)}`,
    },
  );
};

export const formatPercent = (
  value: number | string,
  options: FormatOptions = {},
): string => {
  return processNumeric(
    value,
    options,
    { style: 'percent' },
    {
      invalid: (v) => `${v}%`,
      intlFallback: (num) => `${num * 100}%`,
      cjk: (num, _langCode) => `${formatCardinal(Math.round(num * 100))}%`,
      arabicFallback: (num) => `${toArabicIndicDigits(Math.round(num * 100))}%`,
      devanagariFallback: (num) =>
        `${toDevanagariDigits(Math.round(num * 100))}%`,
      cyrillicFallback: (num) =>
        `${toRussianDigits(Math.round(num * 100))}%`,
    },
  );
};

export const formatUnit = (
  value: number | string,
  unit: string,
  options: FormatOptions = {},
): string => {
  return processNumeric(
    value,
    options,
    { style: 'unit', unit, unitDisplay: 'short' },
    {
      invalid: (v) => `${v} ${unit}`,
      intlFallback: (num) => `${num} ${unit}`,
      cjk: (num, _langCode) => `${formatCardinal(num)}${unit}`,
      arabicFallback: (num) => `${toArabicIndicDigits(num)} ${unit}`,
      devanagariFallback: (num) => `${toDevanagariDigits(num)} ${unit}`,
      cyrillicFallback: (num) => `${toRussianDigits(num)} ${unit}`,
    },
  );
};

export const formatScientific = (
  value: number | string,
  options: FormatOptions = {},
): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  const numberingSystem = getNumberingSystem(options);
  if (num === 0) {
    if (numberingSystem === 'arab') return '٠';
    if (numberingSystem === 'deva') return '०';
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
        const expStr =
          numberingSystem === 'arab'
            ? ` × ١٠${Math.abs(exp)}`
            : numberingSystem === 'deva'
              ? ` × १०${Math.abs(exp)}`
              : `×10${Math.abs(exp)}`;
        return `${n < 0 ? '-' : ''}${(Math.abs(n) / 10 ** exp).toFixed(exp === 0 ? 0 : 1)}${expStr}`;
      },
      cjk: (n, langCode) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        const cMan = formatCardinal(Math.abs(n) / 10 ** exp);
        const cExp = formatCardinal(10 ** Math.abs(exp));
        return `${n < 0 ? (langCode === LANGUAGE.JA ? 'マイナス' : '负') : ''}${cMan}×${cExp}`;
      },
      arabicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${toArabicIndicDigits((Math.abs(n) / 10 ** exp).toFixed(1))}×١٠${toArabicIndicDigits(Math.abs(exp))}`;
      },
      devanagariFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '-' : ''}${toDevanagariDigits((Math.abs(n) / 10 ** exp).toFixed(1))}×१०${toDevanagariDigits(Math.abs(exp))}`;
      },
      cyrillicFallback: (n) => {
        const exp = Math.floor(Math.log10(Math.abs(n)));
        return `${n < 0 ? '−' : ''}${toRussianDigits((Math.abs(n) / 10 ** exp).toFixed(1))}×¹⁰${toRussianDigits(Math.abs(exp))}`;
      },
    },
  );
};

export const formatBytes = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 B';
  const k = 1_024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  return `${parseFloat((bytes / k ** i).toFixed(Math.max(0, decimals)))} ${sizes[i]}`;
};

export const formatAbbreviated = (
  value: number,
  options: FormatOptions = {},
): string => {
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3) | 0;
  if (tier === 0) return formatNumber(value, options);

  const suffix = ['', 'K', 'M', 'B', 'T'][tier];
  const scaled = value / 10 ** (tier * 3);
  const decimals = scaled % 1 === 0 ? 0 : scaled % 0.1 === 0 ? 1 : 2;

  return (
    formatNumber(scaled, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
      ...options,
    }) + suffix
  );
};

const formatIntlDate = (
  date: DateValue,
  options?: Intl.DateTimeFormatOptions,
): string => {
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
): string => formatIntlDate(date, options);

export const formatTime = (
  date: DateValue,
  options?: TimeFormatOptions,
): string => formatIntlDate(date, { timeStyle: options?.timeStyle ?? 'short' });

export const formatDateTime = (
  date: DateValue,
  options?: Intl.DateTimeFormatOptions,
): string =>
  formatIntlDate(date, {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  });

export const formatDuration = (
  seconds: number,
  options?: DurationOptions,
): string => {
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

export const formatList = (
  items: string[],
  options?: ListFormatOptions,
): string => {
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
  if (plan.pricing[locale]) {
    return plan.pricing[locale];
  }
  return plan.pricing.base;
};

export const localPriceCurrency = (plan: RegionalPrice): string => {
  const locale = getLocale();
  if (plan.pricing[locale]) {
    return getCurrency(locale);
  }
  return 'USD';
};

export const convertCurrency = (
  value: number,
  targetCurrency?: string,
  options?: FormatOptions,
): string => {
  const lang = getLocale();
  const currency =
    targetCurrency ||
    LOCALES.find((l) => l.code === lang)?.currency ||
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
  plan: { pricing: { base: number;[locale: string]: number } },
  targetCurrency?: string,
  options?: FormatOptions,
): string => {
  const lang = getLocale();
  const price = localPrice(plan);
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency =
    targetCurrency ||
    LOCALES.find((l) => l.code === lang)?.currency ||
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
    pricing: { base: number;[locale: string]: number };
  },
  options?: FormatOptions,
): string => {
  const price = localPrice(plan);
  const currency = localPriceCurrency(plan);
  return formatCurrency(price, currency, options);
};

export const formatLocalPriceDiscounted = (
  plan: { pricing: { base: number;[locale: string]: number } },
  discountMultiplier: number,
  targetCurrency?: string,
  options?: FormatOptions,
): string => {
  const lang = getLocale();
  const price = localPrice(plan) * discountMultiplier;
  const fromCurrency = localPriceCurrency(plan);
  const toCurrency =
    targetCurrency ||
    LOCALES.find((l) => l.code === lang)?.currency ||
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

export const plural = (
  word: string,
  count?: number,
  inclusive = false,
): string => {
  if (inclusive && count !== undefined) return pluralize(word, count);
  return count === undefined ? pluralize(word) : pluralize(word, count);
};

export const singular = (word: string): string => pluralize.singular(word);

export const formatRelativeTime = (
  value: number,
  options: RelativeTimeOptions,
): string => {
  const lang = getLocale();
  try {
    return new Intl.RelativeTimeFormat(lang, {
      numeric: options.numeric ?? 'auto',
    }).format(value, options.unit);
  } catch {
    return `${value} ${options.unit}`;
  }
};
