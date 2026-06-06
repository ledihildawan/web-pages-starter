import { EXCHANGE_RATES, convertCurrency as convertCurrencyRaw } from '@generated/exchange-rates';
import type { I18nTranslationKeys } from '@generated/i18n';
import i18next, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { DateTimePreset } from '../../utils/types';
import { CURRENCY_CODE } from './currencies';
import { LOCALE_CODES, LOCALES, type LocaleCode } from './data';
import {
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
  getCurrency,
  getLocale,
  getLocaleLabelCountry,
  LOCALE_FALLBACKS,
  LOCALE_STORAGE_KEY,
  plural,
  setLocale,
  singular,
  toNativeDigits,
} from './index';

export { i18next };

const isDev = import.meta.env.DEV;
const missingKeys = new Set<string>();

const getFallbackForLocale = (locale: string): string[] => {
  const localeCode = locale as LocaleCode;
  if (LOCALE_CODES.includes(localeCode)) return [localeCode];

  const explicit = LOCALE_FALLBACKS[localeCode];
  if (explicit) return [explicit, 'en-US'];

  const parts = locale.split('-');
  const languageSubtag =
    parts.length > 1 && parts[1]?.length === 4 ? parts[0] : parts[0];

  const matched = LOCALE_CODES.find((c) => c.startsWith(`${languageSubtag}-`));
  if (matched) return [matched, 'en-US'];

  return ['en-US'];
};

const getVars = (
  el: HTMLElement,
): Record<string, string | number | boolean> => {
  const vars = el.getAttribute('data-i18n-vars');
  if (!vars) return {};
  try {
    return JSON.parse(vars);
  } catch {
    return {};
  }
};

const processElements = (
  selector: string,
  attr: string,
  callback: (el: HTMLElement, val: string) => void,
) => {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const val = el.getAttribute(attr);
    if (val !== null) callback(el, val);
  });
};

const getNativeDigitSetting = (el: HTMLElement): boolean | undefined => {
  if (el.hasAttribute('data-force-native')) return true;
  if (el.hasAttribute('data-force-universal')) return false;
  return undefined;
};

const FORMATTERS = [
  {
    attr: 'data-format-number',
    format: (v: string, el: HTMLElement) =>
      formatNumber(parseFloat(v), {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
      }),
  },
  {
    attr: 'data-format-percent',
    format: (v: string, el: HTMLElement) =>
      formatPercent(parseFloat(v), {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
      }),
  },
  {
    attr: 'data-format-duration',
    format: (v: string) => formatDuration(parseFloat(v)),
  },
  {
    attr: 'data-format-ordinal',
    format: (v: string) => formatOrdinal(parseFloat(v)),
  },
  {
    attr: 'data-format-cardinal',
    format: (v: string) => formatCardinal(parseFloat(v)),
  },
  {
    attr: 'data-format-scientific',
    format: (v: string, el: HTMLElement) =>
      formatScientific(parseFloat(v), {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
      }),
  },
  {
    attr: 'data-format-abbreviated',
    format: (v: string) => formatAbbreviated(parseFloat(v)),
  },
  {
    attr: 'data-format-date',
    format: (v: string) => formatDate(v as DateTimePreset),
  },
  {
    attr: 'data-format-datetime',
    format: (v: string) => formatDateTime(v as DateTimePreset),
  },
  {
    attr: 'data-format-time',
    format: (v: string, el: HTMLElement) =>
      formatTime(v as DateTimePreset, {
        timeStyle: (el.getAttribute('data-time-preset') ??
          'short') as DateTimePreset,
      }),
  },
  {
    attr: 'data-format-date-preset',
    format: (v: string, el: HTMLElement) =>
      formatDate(v as DateTimePreset, {
        dateStyle: (el.getAttribute('data-date-preset') ??
          'medium') as DateTimePreset,
      }),
  },
  {
    attr: 'data-format-currency',
    format: (v: string, el: HTMLElement, dc: string) =>
      formatCurrency(
        parseFloat(v),
        el.getAttribute('data-target-currency') ?? dc,
        {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        },
      ),
  },
  {
    attr: 'data-convert-currency',
    format: (v: string, el: HTMLElement, dc: string) => {
      const currency = el.getAttribute('data-target-currency') ?? dc;
      const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] ?? 1;
      return formatCurrency(parseFloat(v) * rate, currency, {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
      });
    },
  },
  {
    attr: 'data-convert-to-locale',
    format: (v: string, _el: HTMLElement, dc: string) => {
      const rate = EXCHANGE_RATES[dc as keyof typeof EXCHANGE_RATES] ?? 1;
      return formatCurrency(parseFloat(v) * rate, dc, { nativeDigits: false });
    },
  },
  {
    attr: 'data-local-price',
    format: (_v: string, el: HTMLElement, _dc: string) => {
      const pricingStr = el.getAttribute('data-local-price') ?? '{}';
      const discountStr = el.getAttribute('data-discount');
      const explicitTarget = el.getAttribute('data-target-currency');

      let price = 0;
      let fromCurrency: string = CURRENCY_CODE.USD;
      const locale = getLocale();

      try {
        const pricing = JSON.parse(pricingStr);
        if (pricing[locale]) {
          price = pricing[locale];
          fromCurrency = getCurrency(locale);
        } else if (pricing.base) {
          price = pricing.base;
          fromCurrency = CURRENCY_CODE.USD;
        }
      } catch { }

      if (discountStr) {
        price = price * parseFloat(discountStr);
      }

      const targetCurrency =
        explicitTarget && explicitTarget !== 'undefined'
          ? explicitTarget
          : getCurrency(locale);

      if (fromCurrency === targetCurrency) {
        return formatCurrency(price, targetCurrency);
      }

      const converted = convertCurrencyRaw(
        price,
        fromCurrency,
        targetCurrency,
        EXCHANGE_RATES,
      );
      return formatCurrency(converted, targetCurrency);
    },
  },
  {
    attr: 'data-format-unit',
    format: (v: string, el: HTMLElement) => {
      const unit = el.getAttribute('data-unit');
      return unit
        ? formatUnit(parseFloat(v), unit, {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        })
        : v;
    },
  },
  {
    attr: 'data-format-bytes',
    format: (v: string, el: HTMLElement) =>
      formatBytes(
        parseFloat(v),
        parseInt(el.getAttribute('data-bytes-decimals') ?? '2', 10),
      ),
  },
  {
    attr: 'data-relative-time',
    format: (v: string, el: HTMLElement) => {
      const unit = (el.getAttribute('data-unit') ??
        'second') as Intl.RelativeTimeFormatUnit;
      const numeric = el.getAttribute('data-numeric') ?? 'auto';
      const value = parseFloat(v);
      return formatRelativeTime(value, {
        unit,
        numeric: numeric as 'always' | 'auto',
      });
    },
  },
  {
    attr: 'data-format-list',
    format: (_v: string, el: HTMLElement) => {
      const itemsStr = el.getAttribute('data-items') ?? '[]';
      try {
        const items = JSON.parse(itemsStr);
        return Array.isArray(items) ? formatList(items) : itemsStr;
      } catch {
        return itemsStr;
      }
    },
  },
  {
    attr: 'data-pluralized',
    format: (word: string, el: HTMLElement) => {
      const countStr = el.getAttribute('data-count');
      const count = countStr ? parseInt(countStr, 10) : undefined;
      const inclusive = el.getAttribute('data-inclusive') === 'true';
      return plural(word, count, inclusive);
    },
  },
  {
    attr: 'data-singularized',
    format: (word: string) => singular(word),
  },
  {
    attr: 'data-native-digits',
    format: (text: string, el: HTMLElement) => {
      const forceAttr = el.getAttribute('data-force');
      if (forceAttr === null) return toNativeDigits(text);
      return toNativeDigits(text, forceAttr === 'true');
    },
  },
] as const;

export async function initIntl(): Promise<void> {
  const pageID = (window.__PAGE_ID__ ?? 'home') as string;
  const rawData = window.__I18N_DATA__;

  const savedLocale = localStorage.getItem(
    LOCALE_STORAGE_KEY,
  ) as LocaleCode | null;
  const htmlLang = document.documentElement.getAttribute(
    'lang',
  ) as LocaleCode | null;
  const initialLocale = savedLocale || htmlLang;
  if (initialLocale) {
    setLocale(getLocale(initialLocale));
  }

  if (!rawData) return;

  const resources: Resource = {};
  for (const [lngKey, data] of Object.entries(rawData)) {
    const compData = data.comp
      ? Object.fromEntries(
        Object.entries(data.comp).map(([name, content]) => [
          `components/${name}`,
          content,
        ]),
      )
      : {};

    resources[lngKey] = {
      common: data.common,
      [pageID]: data.page,
      ...compData,
    };
  }

  try {
    await i18next.use(LanguageDetector).init({
      resources,
      fallbackLng: getFallbackForLocale,
      supportedLngs: LOCALE_CODES,
      ns: ['common', pageID],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
      },
      interpolation: { escapeValue: false },
      saveMissing: false,
      parseMissingKeyHandler: (key) => {
        if (isDev && !missingKeys.has(key)) {
          missingKeys.add(key);
          console.warn(
            `[i18n] Missing key "${key}" in locale "${i18next.language}"`,
          );
        }
        return `[${key}]`;
      },
    });

    translatePage();
    updateFormattedElements();

    setTimeout(() => {
      updateI18nStoreLabels();
    }, 100);
  } catch { }
}

export const updateI18nStoreLabels = (): void => {
  if (typeof window === 'undefined' || !globalThis.Alpine) {
    return;
  }

  const store = globalThis.Alpine.store('i18n') as {
    languages: Array<{ code: string; label: string; flag: string }>;
  };
  if (!store) {
    return;
  }

  const updatedLanguages = LOCALES.filter((l) =>
    LOCALE_CODES.includes(l.code),
  ).map((l) => {
    return {
      code: l.code,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag,
    };
  });

  store.languages.length = 0;
  updatedLanguages.forEach((lang) => {
    store.languages.push(lang);
  });
};

export const t = (
  key: I18nTranslationKeys,
  vars?: Record<string, string | number | boolean>,
): string => {
  const result = i18next.t(key, vars);
  if (result === key && isDev && !missingKeys.has(key)) {
    missingKeys.add(key);
  }
  return result === key ? `[${key}]` : result;
};

export const translatePage = (): void => {
  processElements('[data-i18n-html]', 'data-i18n-html', (el, key) => {
    const translated = i18next.t(key, getVars(el));
    el.innerHTML = toNativeDigits(translated, getNativeDigitSetting(el));
  });

  processElements('[data-i18n]', 'data-i18n', (el, key) => {
    const translated = t(key as I18nTranslationKeys, getVars(el));
    el.innerHTML = toNativeDigits(translated, getNativeDigitSetting(el));
  });

  processElements('[data-i18n-attr]', 'data-i18n-attr', (el, raw) => {
    if (!raw.includes(':')) return;
    const colonIdx = raw.indexOf(':');
    const attrName = raw.slice(0, colonIdx);
    const translationKey = raw.slice(colonIdx + 1);
    const translated = t(translationKey as I18nTranslationKeys, getVars(el));
    el.setAttribute(attrName, toNativeDigits(translated));
  });

  processElements('[data-i18n-plural]', 'data-i18n-plural', (el, key) => {
    const countStr = el.getAttribute('data-i18n-count');
    if (!countStr) return;
    const pluralKey = key.includes(':') ? key : `common:${key}`;
    const translated = t(pluralKey as I18nTranslationKeys, {
      ...getVars(el),
      count: parseInt(countStr, 10),
    });
    el.textContent = toNativeDigits(translated);
  });

  updateFormattedElements();
};

export const updateFormattedElements = (): void => {
  const locale = getLocale(i18next.language as LocaleCode);
  setLocale(locale);
  const defaultCurrency = getCurrency(locale);

  FORMATTERS.forEach(({ attr, format }) => {
    processElements(`[${attr}]`, attr, (el, v) => {
      el.textContent = format(v, el, defaultCurrency);
    });
  });
};
