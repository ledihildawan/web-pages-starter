import fs from 'node:fs';
import path from 'node:path';
import type { I18nTranslationKeys } from '../../../generated/i18n';
import { DEFAULT_LOCALE, LOCALES, type LocaleCode, type LocaleConfig } from '../../configs/locales';
import { PATHS } from '../../configs/paths';
import type { DateValue, FormatOptions, I18nItem, JsonData, TemplateParams } from '../../types/common';
import { getValueByPath } from '../utils/common';
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
} from '../utils/i18n-format';
import { getPluralSuffix, setLocale } from '../utils/locale';
import {
  loadGlobalData,
  loadSelectedComponentLocales,
  readJSON5,
} from '../utils/json5';

interface TemplateFormatOptions extends FormatOptions {
  raw?: boolean;
  className?: string;
}

const ROOT = process.cwd();
const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

export const getUsedComponents = (
  templatePath: string,
  found = new Set<string>(),
): string[] => {
  if (!fs.existsSync(templatePath)) return [...found];

  const content = fs.readFileSync(templatePath, 'utf-8');
  const componentRegex =
    /(?:include|import|extends)\s+['"](?:components\/)?([\w-]+)\.njk['"]/g;

  const matches = content.matchAll(componentRegex);
  for (const match of matches) {
    const compName = match[1];
    if (!found.has(compName)) {
      const compPath = resolveRoot(`${PATHS.SRC}/components/${compName}.njk`);
      if (fs.existsSync(compPath)) {
        found.add(compName);
        getUsedComponents(compPath, found);
      }
    }
  }

  return [...found];
};

const generateClientI18nScript = (
  lang: string,
  name: string,
  usedComponents: string[],
  supportedLangs: string[],
  LOCALE_STORAGE_KEY: string,
  LOCALES: typeof import('@/configs/locales').LOCALES,
): string => {
  const allI18nData = Object.fromEntries(
    supportedLangs.map((l) => [
      l,
      {
        common: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/common.json5`)),
        comp: loadSelectedComponentLocales(l, usedComponents, resolveRoot(PATHS.LOCALES)),
        page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/${name}.json5`)),
      },
    ]),
  ) as Record<string, JsonData>;

  const langJson = JSON.stringify(lang);
  const nameJson = JSON.stringify(name);
  const componentsJson = JSON.stringify(usedComponents);
  const dataJson = JSON.stringify(allI18nData);
  const languagesJson = JSON.stringify(LOCALES);

  return `<script>
(() => {
  const defaultLocale = ${langJson};
  const savedLocale = localStorage.getItem('${LOCALE_STORAGE_KEY}') ?? defaultLocale;
  const locales = ${languagesJson};

  window.__PAGE_ID__ = ${nameJson};
  window.__USED_COMPONENTS__ = ${componentsJson};
  window.__I18N_DATA__ = ${dataJson};
  window.__SAVED_LOCALE__ = savedLocale;

  const htmlEl = document.documentElement;
  const localeConfig = locales.find(l => l.code === savedLocale);
  const dir = localeConfig?.dir ?? 'ltr';

  htmlEl.setAttribute('dir', dir);
  htmlEl.setAttribute('lang', savedLocale);

  htmlEl.classList.toggle('is-rtl', dir === 'rtl');
})();
</script>`;
};

const createI18nObject = (
  lang: LocaleCode,
  _mergedLocales: JsonData,
  _resolve: (jsonPath: string, vars?: Record<string, unknown>) => string,
  normalizeI18nKey: (key: string) => { ns: string; clientKey: string },
) => {
  setLocale(lang);

  const createItem = (
    key: string | undefined,
    vars: Record<string, unknown> = {},
  ): I18nItem => {
    if (!key) {
      return {
        v: `[missing_key]`,
        k: 'common:site_name' as I18nTranslationKeys,
        vars: null,
      };
    }

    const { ns, clientKey } = normalizeI18nKey(key);
    const varsJson = Object.keys(vars).length ? JSON.stringify(vars) : null;

    return {
      v: _resolve(key, vars),
      k: `${ns}:${clientKey}` as I18nTranslationKeys,
      vars: varsJson,
    };
  };

  const i18nFn = (
    key: string | undefined,
    vars: Record<string, unknown> = {},
  ) => createItem(key, vars);

  const getNormalizedKeyStr = (key: string) => {
    const parts = normalizeI18nKey(key);
    return `${parts.ns}:${parts.clientKey}` as I18nTranslationKeys;
  };

  const getValue = (key: string | undefined, vars: Record<string, unknown> = {}) =>
    createItem(key, vars).v;

  const renderHtml = (
    content: string,
    dataAttrs: Record<string, string | number | boolean>,
    className = '',
  ): string => {
    const attrs = Object.entries(dataAttrs)
      .map(([k, v]) => ` data-${k}="${v}"`)
      .join('');
    const classAttr = className ? ` class="${className}"` : '';
    return `<span${classAttr}${attrs}>${content}</span>`;
  };

  return Object.assign(i18nFn, {
    t: (
      key: string | undefined,
      vars?: Record<string, unknown>,
      options?: { raw?: boolean; native?: boolean; universal?: boolean; className?: string },
    ) => {
      const item = createItem(key, vars ?? {});
      const translated = options?.native ? toNativeDigits(item.v, true)
        : options?.universal ? item.v
          : toNativeDigits(item.v);

      if (options?.raw) return translated;

      const attrs: Record<string, string | number | boolean> = { i18n: item.k };
      if (options?.native) attrs['force-native'] = 'true';
      if (options?.universal) attrs['force-universal'] = 'true';
      if (item.vars) attrs['i18n-vars'] = item.vars.replace(/"/g, '&quot;');
      return renderHtml(translated, attrs, options?.className);
    },

    text: getValue,
    html: getValue,
    attr: (key: string | undefined, attrName: string, vars: Record<string, unknown> = {}) =>
      `${attrName}="${createItem(key, vars).v}"`,

    plural: (
      key: string | undefined,
      count: number,
      vars?: Record<string, unknown>,
      options?: { raw?: boolean; className?: string },
    ) => {
      if (!key) return '';

      const mergedVars = { ...vars, count };
      const lookupKey = `${key}${getPluralSuffix(count)}`;
      const item = createItem(lookupKey, mergedVars);
      const translated = toNativeDigits(item.v);

      if (options?.raw) return translated;

      const attrs: Record<string, string | number | boolean> = {
        'i18n-plural': item.k,
        'i18n-count': count,
      };
      if (item.vars) attrs['i18n-vars'] = item.vars.replace(/"/g, '&quot;');
      return renderHtml(translated, attrs, options?.className);
    },

    formatNumber: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatNumber(value, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'format-number': value,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatCurrency: (
      value: number | string,
      currency: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatCurrency(value, currency, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'format-currency': value,
        'currency-code': currency,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatPercent: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatPercent(value, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'format-percent': value,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatBytes: (bytes: number, decimals = 1, options?: TemplateFormatOptions) => {
      const formatted = formatBytes(bytes, decimals);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-bytes': bytes, 'bytes-decimals': decimals }, options?.className);
    },

    formatDuration: (seconds: number, options?: TemplateFormatOptions) => {
      const formatted = formatDuration(seconds);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-duration': seconds }, options?.className);
    },

    formatDate: (date: DateValue, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatDate(date, formatOpts as Intl.DateTimeFormatOptions);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-date': String(date) }, options?.className);
    },

    formatTime: (date: DateValue, preset: 'short' | 'medium' | 'long' | 'full' = 'short', options?: TemplateFormatOptions) => {
      const formatted = formatTime(date, { timeStyle: preset });
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-time': String(date), 'time-preset': preset }, options?.className);
    },

    formatDateTime: (date: DateValue, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatDateTime(date, formatOpts as Intl.DateTimeFormatOptions);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-datetime': String(date) }, options?.className);
    },

    formatOrdinal: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatOrdinal(value);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-ordinal': value }, options?.className);
    },

    formatCardinal: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatCardinal(value);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-cardinal': value }, options?.className);
    },

    formatScientific: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatScientific(value, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'format-scientific': value,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatAbbreviated: (value: number, options?: TemplateFormatOptions) => {
      const formatted = formatAbbreviated(value);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-abbreviated': value }, options?.className);
    },

    formatList: (items: string[], options?: TemplateFormatOptions) => {
      const formatted = formatList(items);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-list': items.length }, options?.className);
    },

    formatUnit: (value: number | string, unit: string, options?: TemplateFormatOptions) => {
      const formatted = formatUnit(value, unit, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'format-unit': value,
        unit,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    convertCurrency: (value: number, targetCurrency: string, options?: TemplateFormatOptions) => {
      const formatted = convertCurrency(value, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'convert-currency': value,
        'target-currency': targetCurrency,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    localPrice: (plan: { pricing: { base: number;[locale: string]: number } }, options?: TemplateFormatOptions) => {
      const formatted = String(localPrice(plan));
      if (options?.raw) return formatted;
      return renderHtml(formatted, {}, options?.className);
    },

    localPriceCurrency: (plan: { pricing: { base: number;[locale: string]: number } }, options?: TemplateFormatOptions) => {
      const formatted = localPriceCurrency(plan);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {}, options?.className);
    },

    convertLocalPrice: (
      plan: { pricing: { base: number;[locale: string]: number } },
      targetCurrency: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = convertLocalPrice(plan, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'convert-local-price': JSON.stringify(plan),
        'target-currency': targetCurrency,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatLocalPrice: (plan: { pricing: { base: number;[locale: string]: number } }, options?: TemplateFormatOptions) => {
      const formatted = formatLocalPrice(plan, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    formatLocalPriceDiscounted: (
      plan: { pricing: { base: number;[locale: string]: number } },
      discountMultiplier: number,
      targetCurrency: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatLocalPriceDiscounted(plan, discountMultiplier, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {
        'discount-multiplier': discountMultiplier,
        'target-currency': targetCurrency,
        ...(options?.nativeDigits ? { 'use-native': 'true' } : {}),
      }, options?.className);
    },

    pluralize: (word: string, count?: number, inclusive = false, options?: TemplateFormatOptions) => {
      const formatted = plural(word, count, inclusive);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { pluralized: word, count: count ?? 1, inclusive }, options?.className);
    },

    singularize: (word: string, options?: TemplateFormatOptions) => {
      const formatted = singular(word);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { singularized: word }, options?.className);
    },

    formatRelativeTime: (
      value: number,
      options: { unit: Intl.RelativeTimeFormatUnit; numeric?: 'always' | 'auto'; raw?: boolean; className?: string },
    ) => {
      const formatted = formatRelativeTime(value, { unit: options.unit, numeric: options.numeric });
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'relative-time': value, unit: options.unit, numeric: options.numeric ?? 'always' }, options?.className);
    },

    nativeDigits: (text: string, force = false, options?: TemplateFormatOptions) => {
      const formatted = toNativeDigits(text, force);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'native-digits': text, force }, options?.className);
    },

    getPluralSuffix,
  });
};

export const createTemplateParams = (
  params: TemplateParams,
  LOCALE_STORAGE_KEY: string,
  LOCALE_CODES: string[],
) => {
  const name = String(params.entryName || 'home');
  const lang = DEFAULT_LOCALE;
  const isDev = process.env.NODE_ENV !== 'production';

  const templatePath = resolveRoot(`${PATHS.SRC}/pages/${name}/index.njk`);
  const usedComponents = getUsedComponents(templatePath);

  const mergedLocales: JsonData = {
    ...readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/common.json5`)),
    page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/${name}.json5`)),
    comp: loadSelectedComponentLocales(lang, usedComponents, resolveRoot(PATHS.LOCALES)),
  };

  const _resolve = (
    jsonPath: string,
    vars: Record<string, unknown> = {},
  ): string => {
    const val = getValueByPath(mergedLocales, jsonPath);
    let str = val !== undefined ? String(val) : jsonPath;

    if (val === undefined && isDev) {
      console.warn(`[i18n] Missing key "${jsonPath}" in locale "${lang}"`);
    }

    for (const [key, value] of Object.entries(vars)) {
      str = str.replaceAll(`{{${key}}}`, String(value));
    }
    return str;
  };

  const normalizeI18nKey = (key: string): { ns: string; clientKey: string } => {
    if (key.startsWith('page.')) {
      return { ns: name, clientKey: key.slice(5) }; // 'page.'.length === 5
    }
    if (key.startsWith('comp.')) {
      const parts = key.split('.');
      return { ns: `components/${parts[1]}`, clientKey: parts.slice(2).join('.') };
    }
    return { ns: 'common', clientKey: key };
  };

  const i18n = createI18nObject(lang, mergedLocales, _resolve, normalizeI18nKey);

  const localeConfig: LocaleConfig | undefined = LOCALES.find((l) => l.code === lang);

  const localeStorageKey = 'i18nextLocale' as const;

  const clientI18nScript = generateClientI18nScript(
    lang,
    name,
    usedComponents,
    LOCALE_CODES,
    LOCALE_STORAGE_KEY,
    LOCALES,
  );

  return {
    ...params,
    lang,
    localeConfig,
    localeStorageKey,
    locales: LOCALES,
    clientI18nScript,
    page_id: name,
    global: loadGlobalData(resolveRoot(`${PATHS.SRC}/data`)),
    page: readJSON5(resolveRoot(`${PATHS.SRC}/pages/${name}/index.json5`)),
    i18n,
  };
};
