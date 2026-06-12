import {
  convertCurrency as convertCurrencyRaw,
  EXCHANGE_RATES,
} from '../../../../generated/exchange-rates';
import type { DateTimePreset } from '../../utils/types';
import { CURRENCY_CODE } from './currencies';
import type { LocaleCode } from './data';
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
  plural,
  setLocale,
  singular,
  toNativeDigits,
} from './index';

const getNumberingSystemAttr = (el: HTMLElement): string | undefined => {
  const ns = el.getAttribute('data-numbering-system');
  return ns && ns.length > 0 ? ns : undefined;
};

const FORMATTERS = [
  {
    attr: 'data-format-number',
    format: (v: string, el: HTMLElement) =>
      formatNumber(parseFloat(v), {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
        numberingSystem: getNumberingSystemAttr(el),
      }),
  },
  {
    attr: 'data-format-percent',
    format: (v: string, el: HTMLElement) =>
      formatPercent(parseFloat(v), {
        nativeDigits: el.getAttribute('data-use-native') === 'true',
        numberingSystem: getNumberingSystemAttr(el),
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
        numberingSystem: getNumberingSystemAttr(el),
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
          numberingSystem: getNumberingSystemAttr(el),
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
        numberingSystem: getNumberingSystemAttr(el),
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
      } catch {}

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
            numberingSystem: getNumberingSystemAttr(el),
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

const processElements = (
  selector: string,
  attr: string,
  callback: (el: HTMLElement, val: string) => void,
): void => {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const val = el.getAttribute(attr);
    if (val !== null) callback(el, val);
  });
};

export const runFormattedElements = (currentLanguage: string): void => {
  const locale = getLocale(currentLanguage as LocaleCode);
  setLocale(locale);
  const defaultCurrency = getCurrency(locale);

  FORMATTERS.forEach(({ attr, format }) => {
    processElements(`[${attr}]`, attr, (el, v) => {
      el.textContent = format(v, el, defaultCurrency);
    });
  });
};
