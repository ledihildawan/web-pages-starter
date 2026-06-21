import { ACTIVE_LANGUAGES } from '../../generated/active-locales-data';
import type { LocaleCode } from './data/locales';
import type { RegionCode } from './data/regions';
import { getActiveLocales } from './engine/active-locales';
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
  setStrategies,
  singular,
  toNativeDigits,
} from './engine/formatters';
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
} from './engine/helpers';

export type {
  CardinalOptions,
  DurationOptions,
  FormatOptions,
  I18nItem,
  ListFormatOptions,
  OrdinalOptions,
  RegionalPrice,
  RelativeTimeOptions,
  RouteData,
  TemplateFormatOptions,
  TemplateParams,
  TimeFormatOptions,
} from './config/types';

const getLocaleDisplayRegion = (regionCode: RegionCode): string => {
  if (regionCode === 'GB') return 'UK';
  return regionCode;
};

export const getLocaleLabelCountry = (localeCode: LocaleCode): string => {
  const locale = getActiveLocales().find((l) => l.code === localeCode);
  if (!locale) return localeCode;

  const language = ACTIVE_LANGUAGES.find((l) => l.code === locale.language);
  if (!language) return localeCode;

  let nativeName: string;
  if (locale.language === 'zh' && locale.script) {
    nativeName = locale.script === 'Hans' ? '简体中文' : '繁體中文';
  } else {
    nativeName = language.nativeName;
  }
  const regionSuffix = ` (${getLocaleDisplayRegion(locale.region)})`;

  return `${nativeName}${regionSuffix}`;
};

export { DEFAULT_NAMESPACE } from './constants';
export {
  getActiveLocaleCodes,
  getActiveLocales,
  isSingleLocale,
} from './engine/active-locales';

export const getActiveLocalesDisplay = () =>
  getActiveLocales()
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
  setStrategies,
  singular,
  toNativeDigits,
};
