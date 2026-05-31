import { EXCHANGE_RATES } from '@generated/exchange-rates';
import type { I18nTranslationKeys } from '@generated/i18n';
import i18next, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  DEFAULT_LANG,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANG_CODES,
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
import { getCurrency, getFallbackChain, getLanguage } from '../utils/locale';

const isDev = import.meta.env.DEV;
const missingKeys = new Set<string>();

const FALLBACK_CONFIG = Object.fromEntries(
  [
    'zh-SG',
    'zh-TW',
    'zh-HK',
    'en-GB',
    'en-CA',
    'en-AU',
    'en-IN',
    'es-MX',
    'es-AR',
    'es-CO',
    'es-PE',
    'pt-PT',
    'pt-AO',
    'pt-MZ',
    'fr-CA',
    'fr-BE',
    'fr-CH',
    'de-AT',
    'de-CH',
    'ar-AE',
    'ar-EG',
    'ar-MA',
    'ar-TN',
    'hi-NP',
    'ko-KP',
  ].map((loc) => [loc, getFallbackChain(loc)]),
);

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
      fallbackLng: FALLBACK_CONFIG,
      supportedLngs: SUPPORTED_LANG_CODES,
      ns: ['common', pageID],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
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

    if (i18next.language !== DEFAULT_LANG) translatePage();
    updateFormattedElements();
  } catch (error) {
    // Silently fail - i18n is not critical for basic functionality
  }
}

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
  const lng = getLanguage(i18next.language);

  processElements('[data-i18n-html]', 'data-i18n-html', (el, key) => {
    const translated = i18next.t(key, getVars(el));
    const forceNative = el.hasAttribute('data-force-native')
      ? true
      : el.hasAttribute('data-force-universal')
        ? false
        : undefined;
    el.innerHTML = toNativeDigits(translated, lng, forceNative);
  });
  processElements('[data-i18n]', 'data-i18n', (el, key) => {
    const translated = t(key as I18nTranslationKeys, getVars(el));
    const forceNative = el.hasAttribute('data-force-native')
      ? true
      : el.hasAttribute('data-force-universal')
        ? false
        : undefined;
    el.textContent = toNativeDigits(translated, lng, forceNative);
  });

  processElements('[data-i18n-attr]', 'data-i18n-attr', (el, raw) => {
    if (!raw.includes(':')) return;
    const colonIdx = raw.indexOf(':');
    const attrName = raw.slice(0, colonIdx);
    const translationKey = raw.slice(colonIdx + 1);
    const translated = t(translationKey as I18nTranslationKeys, getVars(el));
    el.setAttribute(attrName, toNativeDigits(translated, lng));
  });

  processElements('[data-i18n-plural]', 'data-i18n-plural', (el, key) => {
    const countStr = el.getAttribute('data-i18n-count');
    if (!countStr) return;
    const pluralKey = key.includes(':') ? key : `common:${key}`;
    const translated = t(pluralKey as I18nTranslationKeys, {
      ...getVars(el),
      count: parseInt(countStr, 10),
    });
    el.textContent = toNativeDigits(translated, lng);
  });

  updateFormattedElements();
};

const FORMATTERS: {
  attr: string;
  format: (
    v: string,
    lng: string,
    el: HTMLElement,
    defaultCurrency: string,
  ) => string;
}[] = [
    {
      attr: 'data-format-number',
      format: (v, l, el) =>
        formatNumber(parseFloat(v), l, {
          useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-percent',
      format: (v, l, el) =>
        formatPercent(parseFloat(v), l, {
          useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-duration',
      format: (v, l) => formatDuration(parseFloat(v), l),
    },
    {
      attr: 'data-format-ordinal',
      format: (v, l) => formatOrdinal(parseFloat(v), l),
    },
    {
      attr: 'data-format-cardinal',
      format: (v, l) => formatCardinal(parseFloat(v), l),
    },
    {
      attr: 'data-format-scientific',
      format: (v, l, el) =>
        formatScientific(parseFloat(v), l, {
          useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-format-abbreviated',
      format: (v, l) => formatAbbreviated(parseFloat(v), l),
    },
    {
      attr: 'data-format-date',
      format: (v, l) => formatDate(v as DateTimePreset, l),
    },
    {
      attr: 'data-format-datetime',
      format: (v, l) => formatDateTime(v as DateTimePreset, l),
    },
    {
      attr: 'data-format-time',
      format: (v, _l, el) =>
        formatTime(v as DateTimePreset, {
          timeStyle: (el.getAttribute('data-time-preset') ?? 'short') as DateTimePreset,
        }),
    },
    {
      attr: 'data-format-date-preset',
      format: (v, _l, el) =>
        formatDate(v as DateTimePreset, {
          dateStyle: (el.getAttribute('data-date-preset') ?? 'medium') as DateTimePreset,
        }),
    },
    {
      attr: 'data-format-currency',
      format: (v, l, el, dc) =>
        formatCurrency(parseFloat(v), l, el.getAttribute('data-target-currency') ?? dc, {
          useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
        }),
    },
    {
      attr: 'data-convert-currency',
      format: (v, l, el, dc) => {
        const currency = el.getAttribute('data-target-currency') ?? dc;
        const rate = EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES] ?? 1;
        return formatCurrency(parseFloat(v) * rate, l, currency, {
          useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
        });
      },
    },
    {
      attr: 'data-local-price',
      format: (_v, l, el, _dc) => {
        let pricingStr = el.getAttribute('data-pricing') ?? '{}';
        const discountStr = el.getAttribute('data-discount');

        // Decode HTML entities (&quot; → ")
        pricingStr = pricingStr.replace(/&quot;/g, '"');

        let price = 0;
        let fromCurrency = 'USD';

        try {
          const pricing = JSON.parse(pricingStr);
          if (pricing[l]) {
            price = pricing[l];
            fromCurrency = getCurrency(l);
          } else if (pricing.base) {
            price = pricing.base;
            fromCurrency = 'USD';
          }
        } catch { }

        if (discountStr) {
          price = price * parseFloat(discountStr);
        }

        const targetCurrency = getCurrency(l);

        if (fromCurrency === targetCurrency) {
          return formatCurrency(price, l, targetCurrency);
        }

        const rate =
          EXCHANGE_RATES[targetCurrency as keyof typeof EXCHANGE_RATES] ?? 1;
        const converted = price * rate;
        return formatCurrency(converted, l, targetCurrency);
      },
    },
    {
      attr: 'data-format-unit',
      format: (v, l, el) => {
        const unit = el.getAttribute('data-unit');
        return unit
          ? formatUnit(parseFloat(v), l, unit, {
            useNativeNumberingSystem: el.getAttribute('data-use-native') === 'true',
          })
          : v;
      },
    },
    {
      attr: 'data-format-bytes',
      format: (v, _l, el) =>
        formatBytes(
          parseFloat(v),
          parseInt(el.getAttribute('data-bytes-decimals') ?? '2', 10),
        ),
    },
  ];

export const updateFormattedElements = (): void => {
  const lng = getLanguage(i18next.language);
  const defaultCurrency = getCurrency(lng);

  FORMATTERS.forEach(({ attr, format }) => {
    processElements(`[${attr}]`, attr, (el, v) => {
      el.textContent = format(v, lng, el, defaultCurrency);
    });
  });
};
