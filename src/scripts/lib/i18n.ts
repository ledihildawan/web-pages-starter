import { EXCHANGE_RATES } from '@generated/exchange-rates';
import type { I18nTranslationKeys } from '@generated/i18n';
import i18next, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  BASE_CURRENCY,
  CURRENCY_CODE,
  DEFAULT_LOCALE,
  LANGUAGE_CODE,
  LANGUAGES,
  LOCALE_CODES,
  LOCALE_FALLBACKS,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type LocaleCode,
  REGIONS,
} from '@/configs/locales';
import type { DateTimePreset } from '@/types/common';
import {
  formatAbbreviated,
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatScientific,
  formatTime,
  formatUnit,
  toNativeDigits,
} from '../utils/i18n-format';
import { getCurrency, getLocale, setLocale } from '../utils/locale';

const isDev = import.meta.env.DEV;
const missingKeys = new Set<string>();

const getFallbackForLocale = (lng: string): string[] => {
  const locale = lng as LocaleCode;
  if (LOCALE_CODES.includes(locale)) return [locale];

  const explicit = LOCALE_FALLBACKS[locale];
  if (explicit) return [explicit, DEFAULT_LOCALE];

  // Extract base language code from BCP 47 tag
  // e.g., 'zh-Hans-CN' → 'zh', 'en-US' → 'en'
  const parts = locale.split('-');
  const baseLang =
    parts.length > 1 && parts[1]?.length === 4
      ? parts[0] // Skip script tag (e.g., 'zh-Hans' → 'zh')
      : parts[0]; // No script, use first part as-is (e.g., 'en-US' → 'en')

  const matched = LOCALE_CODES.find((c) => c.startsWith(`${baseLang}-`));
  if (matched) return [matched, DEFAULT_LOCALE];

  return [DEFAULT_LOCALE];
};

export async function initIntl(): Promise<void> {
  const pageID = (window.__PAGE_ID__ ?? 'home') as string;
  const rawData = window.__I18N_DATA__;

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

    // Update store labels after a short delay to ensure Alpine is ready
    setTimeout(() => {
      updateI18nStoreLabels();
    }, 100);
  } catch { }
}

/**
 * Mapping from language code to translation key in common.json5
 */
const LANGUAGE_KEY_MAP: Record<string, string> = {
  [LANGUAGE_CODE.ID]: 'lang_indonesia',
  [LANGUAGE_CODE.EN]: 'lang_inggris',
  [LANGUAGE_CODE.JA]: 'lang_jepang',
  zh: 'lang_tiongkok',
  'zh-Hans': 'lang_tiongkok_sederhana',
  'zh-Hant': 'lang_tiongkok_tradisional',
  ar: 'lang_arab',
  es: 'lang_spanyol',
  pt: 'lang_portugis',
  hi: 'lang_hindi',
  ko: 'lang_korea',
  fr: 'lang_perancis',
  de: 'lang_jerman',
  ru: 'lang_rusia',
  th: 'lang_thailand',
};

/**
 * Update the Alpine i18n store with translated language and region names
 * Uses translations from common.json5 (lang_* and region_* keys)
 * Call this after i18n is initialized
 */
const updateI18nStoreLabels = (): void => {
  if (typeof window === 'undefined' || !globalThis.Alpine) {
    return;
  }

  const store = globalThis.Alpine.store('i18n');
  if (!store) {
    return;
  }

  const updatedLanguages = LOCALES.filter((l) =>
    LOCALE_CODES.includes(l.code),
  ).map((l) => {
    // Get translated language name from common.json5
    const langKey = LANGUAGE_KEY_MAP[l.language];
    const langName = langKey ? i18next.t(langKey) : l.language;

    // Get translated region name from common.json5
    const regionKey = `region_${l.region.toLowerCase()}`;
    const regionName = i18next.t(regionKey);

    // Format: "Translated Language Name (Translated Country Name)"
    return {
      code: l.code,
      label: `${langName} (${regionName})`,
      flag: l.flag,
    };
  });

  // Update each item in the languages array to trigger reactivity
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
    if (val) callback(el, val);
  });
};

export const translatePage = (): void => {
  processElements('[data-i18n-html]', 'data-i18n-html', (el, key) => {
    const translated = i18next.t(key, getVars(el));
    const forceNative = el.hasAttribute('data-force-native')
      ? true
      : el.hasAttribute('data-force-universal')
        ? false
        : undefined;
    el.innerHTML = toNativeDigits(translated, forceNative);
  });
  processElements('[data-i18n]', 'data-i18n', (el, key) => {
    const translated = t(key as I18nTranslationKeys, getVars(el));
    const forceNative = el.hasAttribute('data-force-native')
      ? true
      : el.hasAttribute('data-force-universal')
        ? false
        : undefined;
    el.innerHTML = toNativeDigits(translated, forceNative);
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

const FORMATTERS: {
  attr: string;
  format: (v: string, el: HTMLElement, defaultCurrency: string) => string;
}[] = [
    {
      attr: 'data-format-number',
      format: (v, el) =>
        formatNumber(parseFloat(v), {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-percent',
      format: (v, el) =>
        formatPercent(parseFloat(v), {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-duration',
      format: (v) => formatDuration(parseFloat(v)),
    },
    {
      attr: 'data-format-ordinal',
      format: (v) => formatOrdinal(parseFloat(v)),
    },
    {
      attr: 'data-format-cardinal',
      format: (v) => formatCardinal(parseFloat(v)),
    },
    {
      attr: 'data-format-scientific',
      format: (v, el) =>
        formatScientific(parseFloat(v), {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-abbreviated',
      format: (v) => formatAbbreviated(parseFloat(v)),
    },
    {
      attr: 'data-format-date',
      format: (v) => formatDate(v as DateTimePreset),
    },
    {
      attr: 'data-format-datetime',
      format: (v) => formatDateTime(v as DateTimePreset),
    },
    {
      attr: 'data-format-time',
      format: (v, el) =>
        formatTime(v as DateTimePreset, {
          timeStyle: (el.getAttribute('data-time-preset') ??
            'short') as DateTimePreset,
        }),
    },
    {
      attr: 'data-format-date-preset',
      format: (v, el) =>
        formatDate(v as DateTimePreset, {
          dateStyle: (el.getAttribute('data-date-preset') ??
            'medium') as DateTimePreset,
        }),
    },
    {
      attr: 'data-format-currency',
      format: (v, el, dc) =>
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
      format: (v, el, dc) => {
        const currency = el.getAttribute('data-target-currency') ?? dc;
        const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] ?? 1;
        return formatCurrency(parseFloat(v) * rate, currency, {
          nativeDigits: el.getAttribute('data-use-native') === 'true',
        });
      },
    },
    {
      attr: 'data-local-price',
      format: (_v, el, _dc) => {
        let pricingStr = el.getAttribute('data-pricing') ?? '{}';
        const discountStr = el.getAttribute('data-discount');

        // Decode HTML entities (&quot; → ")
        pricingStr = pricingStr.replace(/&quot;/g, '"');

        let price = 0;
        let fromCurrency = BASE_CURRENCY;
        const locale = getLocale();

        try {
          const pricing = JSON.parse(pricingStr);
          if (pricing[locale]) {
            price = pricing[locale];
            fromCurrency = getCurrency(locale);
          } else if (pricing.base) {
            price = pricing.base;
            fromCurrency = BASE_CURRENCY;
          }
        } catch { }

        if (discountStr) {
          price = price * parseFloat(discountStr);
        }

        const targetCurrency = getCurrency(locale);

        if (fromCurrency === targetCurrency) {
          return formatCurrency(price, targetCurrency);
        }

        const rate =
          EXCHANGE_RATES[targetCurrency as keyof typeof EXCHANGE_RATES] ?? 1;
        const converted = price * rate;
        return formatCurrency(converted, targetCurrency);
      },
    },
    {
      attr: 'data-format-unit',
      format: (v, el) => {
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
      format: (v, el) =>
        formatBytes(
          parseFloat(v),
          parseInt(el.getAttribute('data-bytes-decimals') ?? '2', 10),
        ),
    },
  ];

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
