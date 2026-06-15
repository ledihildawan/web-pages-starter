/**
 * @web-pages-starter/i18n — Internationalization engine
 *
 * Locale-aware formatting, translation, and runtime switching for
 * 136 BCP 47 locales across 93 languages.
 *
 * @example
 * ```ts
 * import { formatCurrency, formatDate, getDirection } from '@i18n';
 *
 * setLocale('ja-JP');
 * formatCurrency(99.99, 'JPY');     // "¥100"
 * formatDate('2026-06-15');          // "2026/06/15"
 * getDirection('ar-SA');             // "rtl"
 * ```
 */

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

/** Filtered locale/language data (active locales only in production). */
export {
  ACTIVE_LANGUAGES,
  LOCALE_CODES,
  LOCALES,
} from '../../generated/active-locales-data';
/** Type-safe config builders with runtime validation. */
export { defineFont, defineFontStack, defineI18n } from './config/define';
/** All shared TypeScript types for config, formatting options, and data shapes. */
export type {
  CardinalOptions,
  DurationOptions,
  FontConfig,
  FontStack,
  FontWeight,
  FormatOptions,
  I18nConfig,
  I18nItem,
  ListFormatOptions,
  OrdinalOptions,
  RegionalPrice,
  RelativeTimeOptions,
  TemplateFormatOptions,
  TemplateParams,
  TimeFormatOptions,
} from './config/types';
/** Locale code type (union of all 136 BCP 47 codes) and config shape. */
export type { LocaleCode, LocaleConfig } from './data/locales';

/** Returns the list of active locale codes from `i18nConfig`. Memoized. */
export {
  getActiveLocaleCodes,
  getActiveLocales,
} from './engine/active-locales';

/**
 * Returns a human-readable label for a locale, e.g. `"English (US)"`, `"简体中文 (CN)"`.
 * Handles Chinese script variants (Hans/Hant) and displays GB as UK.
 */
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

/**
 * Returns active locales as `{ code, label, flag }[]` sorted alphabetically by label.
 * Used by the navbar language switcher.
 */
export const getActiveLocalesDisplay = () =>
  getActiveLocales()
    .map((l) => ({
      code: l.code,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag.toLowerCase(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

/** localStorage key for persisting the user's selected locale. */
export const LOCALE_STORAGE_KEY = 'i18nextLocale' as const;

/* ── Locale helpers ── */

/** Sets the active locale for all subsequent formatter/helper calls. */
/** Returns the currently active locale (or resolves a fallback). */
/** Returns `true` if the locale's writing direction is RTL. */
/** Returns `'ltr'` or `'rtl'` for the given locale. */
/** Returns the currency code (e.g. `'USD'`, `'IDR'`) for the given locale. */
/** Returns the IANA timezone (e.g. `'America/New_York'`) for the given locale. */
/** Returns the UTC offset in hours for the given locale. */
/** Returns the calendar code (e.g. `'gregory'`) for the given locale. */
/** Returns the first day of week (0=Sunday, 1=Monday) for the given locale. */
/** Returns the Intl numbering system code for the given locale. */
/** Returns whether the locale renders native digits by default. */
/** Returns the language subtag (e.g. `'zh'` from `'zh-Hans-CN'`). */
/** Returns the region subtag (e.g. `'CN'` from `'zh-Hans-CN'`). */
/** Returns the locale config object for the given locale code. */
/** Returns the i18next plural suffix (`'_one'`, `'_other'`, etc.) for a count. */
/** Returns the fallback chain for an unknown locale (e.g. `['en', 'en-US']`). */
export {
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
};

/* ── Formatters ── */

/** Formats a number using the active locale's Intl.NumberFormat. */
/** Formats a currency value (e.g. `formatCurrency(99.99, 'USD')` → `"$99.99"`). */
/** Formats a percentage (e.g. `formatPercent(0.85)` → `"85%"`). */
/** Formats a byte size with binary units (e.g. `formatBytes(1536)` → `"1.5 KB"`). */
/** Formats a duration in seconds (e.g. `formatDuration(3661)` → `"1 hour, 1 minute"`). */
/** Formats a date using the active locale's timezone and calendar. */
/** Formats a time with a preset (`'short'` | `'medium'` | `'long'` | `'full'`). */
/** Formats a combined date and time. */
/** Formats an ordinal number (e.g. `formatOrdinal(1)` → `"1st"`, `"kesatu"` for id-ID). */
/** Spells out a cardinal number (e.g. `formatCardinal(42)` → `"forty-two"` for manual strategies). */
/** Formats a number in scientific notation. */
/** Formats a number in compact/abbreviated form (e.g. `formatAbbreviated(15000)` → `"15K"`). */
/** Formats a list of strings (e.g. `formatList(['a', 'b', 'c'])` → `"a, b, and c"`). */
/** Formats a value with a unit (e.g. `formatUnit(100, 'kilometer')`). */
/** Formats a relative time (e.g. `formatRelativeTime(-1, { unit: 'day' })` → `"yesterday"`). */
/** Converts digits in text to the locale's native numbering system. Pass `force=true` to override `nativeDigits: false`. */
/** English pluralization via the `pluralize` library. */
/** English singularization via the `pluralize` library. */
/** Registers cardinal/ordinal strategies (called internally during bootstrap). */
export {
  formatAbbreviated,
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatList,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatRelativeTime,
  formatScientific,
  formatTime,
  formatUnit,
  plural,
  setStrategies,
  singular,
  toNativeDigits,
};

/* ── Pricing ── */

/** Returns the raw numeric price for the active locale from a `RegionalPrice` plan. */
/** Returns the currency code for the active locale's price. */
/** Converts a value from the active locale's currency to a target currency. */
/** Converts a `RegionalPrice` to a target currency. */
/** Formats the locale-specific price with currency symbol. */
/** Formats the locale-specific price with a discount multiplier applied. */
export {
  convertCurrency,
  convertLocalPrice,
  formatLocalPrice,
  formatLocalPriceDiscounted,
  localPrice,
  localPriceCurrency,
};

const getLocaleDisplayRegion = (regionCode: RegionCode): string => {
  if (regionCode === 'GB') return 'UK';
  return regionCode;
};
