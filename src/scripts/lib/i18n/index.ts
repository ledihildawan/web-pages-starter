import { i18nConfig } from '../../../configs/i18n';
import { LOCALES, type LocaleCode } from './data';
import {
  convertCurrency,
  convertLocalPrice,
  formatAbbreviated,
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatList,
  formatLocalPrice,
  formatLocalPriceDiscounted,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatRelativeTime,
  formatScientific,
  formatTime,
  formatUnit,
  localPrice,
  localPriceCurrency,
  plural,
  singular,
  toNativeDigits,
} from './formatters';
import {
  getCalendar,
  getCurrency,
  getDefaultNativeDigits,
  getDirection,
  getFallbackChain,
  getFirstDayOfWeek,
  getLanguageConfig,
  getLanguageSubtag,
  getLocale,
  getNumberingSystem,
  getPluralSuffix,
  getRegionSubtag,
  getTimezone,
  getTimezoneOffset,
  isRTL,
  setLocale,
} from './helpers';
import { LANGUAGE_CODE, LANGUAGES, SCRIPT_CODE } from './languages';
import { REGION_CODE, type RegionCode } from './regions';

export type {
  CardinalOptions,
  DurationOptions,
  FormatOptions,
  I18nItem,
  ListFormatOptions,
  OrdinalOptions,
  RegionalPrice,
  RelativeTimeOptions,
  TemplateParams,
  TimeFormatOptions,
} from './types';

const getLocaleDisplayRegion = (regionCode: RegionCode): string => {
  if (regionCode === REGION_CODE.GB) return 'UK';
  return regionCode;
};

export const getLocaleLabelCountry = (localeCode: LocaleCode): string => {
  const locale = LOCALES.find((l) => l.code === localeCode);
  if (!locale) return localeCode;

  const language = LANGUAGES.find((l) => l.code === locale.language);
  if (!language) return localeCode;

  let nativeName: string;
  if (locale.language === LANGUAGE_CODE.ZH && locale.script) {
    nativeName = locale.script === SCRIPT_CODE.HANS ? '简体中文' : '繁體中文';
  } else {
    nativeName = language.nativeName;
  }
  const regionSuffix = ` (${getLocaleDisplayRegion(locale.region)})`;

  return `${nativeName}${regionSuffix}`;
};

export const getActiveLocaleCodes = (): LocaleCode[] => [
  i18nConfig.defaultLocale,
  ...(i18nConfig.locales ?? []),
];

export const getActiveLocalesDisplay = () =>
  LOCALES.filter((l) => getActiveLocaleCodes().includes(l.code))
    .map((l) => ({
      code: l.code,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag.toLowerCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const LOCALE_STORAGE_KEY = 'i18nextLocale' as const;

export {
  convertCurrency,
  convertLocalPrice,
  formatAbbreviated,
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatList,
  formatLocalPrice,
  formatLocalPriceDiscounted,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatRelativeTime,
  formatScientific,
  formatTime,
  formatUnit,
  getCalendar,
  getCurrency,
  getDefaultNativeDigits,
  getDirection,
  getFallbackChain,
  getFirstDayOfWeek,
  getLanguageConfig,
  getLanguageSubtag,
  getLocale,
  getNumberingSystem,
  getPluralSuffix,
  getRegionSubtag,
  getTimezone,
  getTimezoneOffset,
  isRTL,
  localPrice,
  localPriceCurrency,
  plural,
  setLocale,
  singular,
  toNativeDigits,
};
