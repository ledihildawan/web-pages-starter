import fs from 'node:fs';
import path from 'node:path';
import type { I18nTranslationKeys } from '../../../../generated/i18n';
import { i18nConfig } from '../../../configs/i18n';
import { ROOT_PAGE } from '../../../configs/site';
import { PATHS } from '../../../configs/paths';
import { getValueByPath } from '../../utils/common';
import {
  loadGlobalData,
  loadSelectedComponentLocales,
  readJSON5,
} from '../../utils/json5';
import type { DateValue, JsonData } from '../../utils/types';
import type { CurrencyCode } from './currencies';
import { LOCALES, type LocaleCode, type LocaleConfig } from './data';
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
  getLocaleLabelCountry,
  getPluralSuffix,
  localPrice,
  localPriceCurrency,
  plural,
  setLocale,
  singular,
  toNativeDigits,
} from './index';

import type { FormatOptions, I18nItem, TemplateParams } from './types';

interface TemplateFormatOptions extends FormatOptions {
  raw?: boolean;
  className?: string;
}

const ROOT = process.cwd();
const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

const escapeHtmlAttr = (value: string | number | boolean): string =>
  String(value).replace(/"/g, '&quot;');

const warnedKeys = new Set<string>();

export const getUsedComponents = (
  templatePath: string,
  found = new Set<string>(),
): string[] => {
  if (!fs.existsSync(templatePath)) return [...found];

  const content = fs.readFileSync(templatePath, 'utf-8');
  const componentRegex =
    /(?:include|import|extends)\s+['"](?:components\/)?([\w-]+)\.njk['"]/g;

  for (const match of content.matchAll(componentRegex)) {
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
  supportedLangs: readonly string[],
  LOCALE_STORAGE_KEY: string,
  locales: typeof LOCALES,
): string => {
  const allI18nData = Object.fromEntries(
    supportedLangs.map((l) => [
      l,
      {
        common: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/common.json5`)),
        comp: loadSelectedComponentLocales(
          l,
          usedComponents,
          resolveRoot(PATHS.LOCALES),
        ),
        page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/${name}.json5`)),
      },
    ]),
  ) as Record<string, JsonData>;

  const dirs = [
    resolveRoot('public', 'assets', 'i18n', name),
    resolveRoot('dist', 'assets', 'i18n', name),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  for (const [localeCode, data] of Object.entries(allI18nData)) {
    const json = JSON.stringify(data);
    for (const dir of dirs) {
      fs.writeFileSync(path.join(dir, `${localeCode}.json`), json, 'utf-8');
    }
  }

  return `<script>
(() => {
  const defaultLocale = ${JSON.stringify(lang)};

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathLocale = pathParts[0]?.match(/^[a-z]{2}(-[A-Z]{2})?$/)?.[0];

  const savedLocale = localStorage.getItem('${LOCALE_STORAGE_KEY}') ?? pathLocale ?? defaultLocale;
  const locales = ${JSON.stringify(locales)};

  window.__PAGE_ID__ = ${JSON.stringify(name)};
  window.__USED_COMPONENTS__ = ${JSON.stringify(usedComponents)};
  window.__SAVED_LOCALE__ = savedLocale;
  window.__SERVER_LOCALE__ = defaultLocale;

  const htmlEl = document.documentElement;
  if (savedLocale !== htmlEl.getAttribute('lang')) {
    const localeConfig = locales.find(l => l.code === savedLocale);
    const dir = localeConfig?.dir ?? 'ltr';
    const ws = localeConfig?.writingSystem ?? 'latin';

    htmlEl.setAttribute('lang', savedLocale);
    htmlEl.setAttribute('dir', dir);
    htmlEl.setAttribute('data-script', ws);
    htmlEl.classList.toggle('is-rtl', dir === 'rtl');
  }
})();
</script>`;
};

const createI18nObject = (
  localeCode: LocaleCode,
  resolveFn: (jsonPath: string, vars?: Record<string, unknown>) => string,
  normalizeI18nKey: (key: string) => { ns: string; clientKey: string },
) => {
  setLocale(localeCode);

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
      v: resolveFn(key, vars),
      k: `${ns}:${clientKey}` as I18nTranslationKeys,
      vars: varsJson,
    };
  };

  const buildAttrs = (
    base: Record<string, string | number | boolean | undefined>,
    vars?: string | null,
    nativeDigits?: boolean,
  ): Record<string, string | number | boolean> => {
    const result: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(base)) {
      if (value !== undefined) result[key] = value;
    }
    if (vars) result['i18n-vars'] = vars;
    if (nativeDigits) result['use-native'] = 'true';
    return result;
  };

  const renderHtml = (
    content: string,
    dataAttrs: Record<string, string | number | boolean>,
    className = '',
  ): string => {
    const attrs = Object.entries(dataAttrs)
      .map(([k, v]) => ` data-${k}="${escapeHtmlAttr(v)}"`)
      .join('');
    const classAttr = className ? ` class="${className}"` : '';
    return `<span${classAttr}${attrs}>${content}</span>`;
  };

  const i18nFn = (
    key: string | undefined,
    vars: Record<string, unknown> = {},
  ) => createItem(key, vars);

  return Object.assign(i18nFn, {
    t: (
      key: string | undefined,
      vars: Record<string, unknown> = {},
      options?: {
        raw?: boolean;
        native?: boolean;
        universal?: boolean;
        className?: string;
      },
    ) => {
      const item = createItem(key, vars);
      const translated = options?.native
        ? toNativeDigits(item.v, true)
        : options?.universal
          ? item.v
          : toNativeDigits(item.v);

      if (options?.raw) return translated;

      const attrs = buildAttrs(
        { i18n: item.k },
        item.vars?.replace(/"/g, '&quot;'),
        options?.native ? true : undefined,
      );

      if (options?.native) attrs['force-native'] = 'true';
      if (options?.universal) attrs['force-universal'] = 'true';

      return renderHtml(translated, attrs, options?.className);
    },

    text: (key: string | undefined, vars: Record<string, unknown> = {}) =>
      createItem(key, vars).v,

    html: (key: string | undefined, vars: Record<string, unknown> = {}) =>
      createItem(key, vars).v,

    attr: (
      key: string | undefined,
      attrName: string,
      vars: Record<string, unknown> = {},
    ) => {
      const item = createItem(key, vars);
      return `${attrName}="${item.v}"` +
        (key ? ` data-i18n-attr="${attrName}:${item.k}"` : '');
    },

    plural: (
      key: string | undefined,
      count: number,
      vars: Record<string, unknown> = {},
      options?: { raw?: boolean; className?: string },
    ) => {
      if (!key) return '';

      const mergedVars = { ...vars, count };
      const lookupKey = `${key}${getPluralSuffix(count)}`;
      const item = createItem(lookupKey, mergedVars);
      const translated = toNativeDigits(item.v);

      if (options?.raw) return translated;

      const attrs = buildAttrs(
        { 'i18n-plural': item.k, 'i18n-count': count },
        item.vars?.replace(/"/g, '&quot;'),
      );

      return renderHtml(translated, attrs, options?.className);
    },

    formatNumber: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatNumber(value, options);
      if (options?.raw) return formatted;
      const attrs: Record<string, string | number | boolean> = {
        'format-number': value,
      };
      if (options?.numberingSystem) {
        attrs['numbering-system'] = options.numberingSystem;
      }
      if (options?.nativeDigits) {
        attrs['use-native'] = 'true';
      }
      return renderHtml(formatted, attrs, options?.className);
    },

    formatCurrency: (
      value: number | string,
      currency: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatCurrency(value, currency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'format-currency': value, 'currency-code': currency },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatPercent: (
      value: number | string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatPercent(value, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'format-percent': value },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatBytes: (
      bytes: number,
      decimals = 1,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatBytes(bytes, decimals);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-bytes': bytes, 'bytes-decimals': decimals },
        options?.className,
      );
    },

    formatDuration: (seconds: number, options?: TemplateFormatOptions) => {
      const formatted = formatDuration(seconds);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-duration': seconds },
        options?.className,
      );
    },

    formatDate: (date: DateValue, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatDate(
        date,
        formatOpts as Intl.DateTimeFormatOptions,
      );
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-date': String(date) },
        options?.className,
      );
    },

    formatTime: (
      date: DateValue,
      preset: 'short' | 'medium' | 'long' | 'full' = 'short',
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatTime(date, { timeStyle: preset });
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-time': String(date), 'time-preset': preset },
        options?.className,
      );
    },

    formatDateTime: (date: DateValue, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatDateTime(
        date,
        formatOpts as Intl.DateTimeFormatOptions,
      );
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-datetime': String(date) },
        options?.className,
      );
    },

    formatOrdinal: (
      value: number | string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatOrdinal(value);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-ordinal': value },
        options?.className,
      );
    },

    formatCardinal: (
      value: number | string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatCardinal(value);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-cardinal': value },
        options?.className,
      );
    },

    formatScientific: (
      value: number | string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatScientific(value, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'format-scientific': value },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatAbbreviated: (value: number, options?: TemplateFormatOptions) => {
      const formatted = formatAbbreviated(value);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'format-abbreviated': value },
        options?.className,
      );
    },

    formatList: (items: string[], options?: TemplateFormatOptions) => {
      const formatted = formatList(items);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        {
          'format-list': '',
          items: escapeHtmlAttr(JSON.stringify(items)),
        },
        options?.className,
      );
    },

    formatUnit: (
      value: number | string,
      unit: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatUnit(value, unit, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'format-unit': value, unit },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    convertCurrency: (
      value: number,
      targetCurrency: string,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = convertCurrency(value, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'convert-currency': value, 'target-currency': targetCurrency },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    localPrice: (
      plan: { pricing: { base: number;[locale: string]: number } },
      options?: TemplateFormatOptions,
    ) => {
      const formatted = String(localPrice(plan));
      if (options?.raw) return formatted;
      return renderHtml(formatted, {}, options?.className);
    },

    localPriceCurrency: (
      plan: { pricing: { base: number;[locale: string]: number } },
      options?: TemplateFormatOptions,
    ) => {
      const formatted = localPriceCurrency(plan);
      if (options?.raw) return formatted;
      return renderHtml(formatted, {}, options?.className);
    },

    convertLocalPrice: (
      plan: { pricing: { base: number;[locale: string]: number } },
      targetCurrency: CurrencyCode,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = convertLocalPrice(plan, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          {
            'local-price': escapeHtmlAttr(JSON.stringify(plan.pricing)),
            'target-currency': targetCurrency,
          },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatLocalPrice: (
      plan: { pricing: { base: number;[locale: string]: number } },
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatLocalPrice(plan, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          { 'local-price': escapeHtmlAttr(JSON.stringify(plan.pricing)) },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatLocalPriceDiscounted: (
      plan: { pricing: { base: number;[locale: string]: number } },
      discountMultiplier: number,
      targetCurrency: CurrencyCode,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatLocalPriceDiscounted(
        plan,
        discountMultiplier,
        targetCurrency,
        options,
      );
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          {
            'local-price': escapeHtmlAttr(JSON.stringify(plan.pricing)),
            discount: discountMultiplier,
            'target-currency': targetCurrency,
          },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    pluralize: (
      word: string,
      count?: number,
      inclusive = false,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = plural(word, count, inclusive);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { pluralized: word, count: count ?? 1, inclusive },
        options?.className,
      );
    },

    singularize: (word: string, options?: TemplateFormatOptions) => {
      const formatted = singular(word);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { singularized: word }, options?.className);
    },

    formatRelativeTime: (
      value: number,
      options: {
        unit: Intl.RelativeTimeFormatUnit;
        numeric?: 'always' | 'auto';
        raw?: boolean;
        className?: string;
      },
    ) => {
      const formatted = formatRelativeTime(value, {
        unit: options.unit,
        numeric: options.numeric,
      });
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        {
          'relative-time': value,
          unit: options.unit,
          numeric: options.numeric ?? 'always',
        },
        options?.className,
      );
    },

    nativeDigits: (
      text: string,
      force = false,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = toNativeDigits(text, force);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        { 'native-digits': text, force },
        options?.className,
      );
    },

    getPluralSuffix,
  });
};

export const createTemplateParams = (
  params: TemplateParams,
  LOCALE_STORAGE_KEY: string,
  LOCALE_CODES: readonly string[],
) => {
  const name = String(params.entryName || ROOT_PAGE);
  const lang = i18nConfig.defaultLocale;

  const templatePath = resolveRoot(`${PATHS.SRC}/pages/${name}/index.njk`);
  const usedComponents = getUsedComponents(templatePath);

  const mergedLocales: JsonData = {
    ...readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/common.json5`)),
    page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/${name}.json5`)),
    comp: loadSelectedComponentLocales(
      lang,
      usedComponents,
      resolveRoot(PATHS.LOCALES),
    ),
  };

  const resolve = (
    jsonPath: string,
    vars: Record<string, unknown> = {},
  ): string => {
    const val = getValueByPath(mergedLocales, jsonPath);
    let str = val !== undefined ? String(val) : jsonPath;

    if (
      val === undefined &&
      process.env.NODE_ENV !== 'production' &&
      !warnedKeys.has(jsonPath)
    ) {
      warnedKeys.add(jsonPath);
      console.warn(`[i18n] Missing key "${jsonPath}" in locale "${lang}"`);
    }

    for (const [key, value] of Object.entries(vars)) {
      str = str.replaceAll(`{{${key}}}`, String(value));
    }
    return str;
  };

  const normalizeI18nKey = (key: string): { ns: string; clientKey: string } => {
    if (key.startsWith('page.')) {
      return { ns: name, clientKey: key.slice(5) };
    }
    if (key.startsWith('comp.')) {
      const parts = key.split('.');
      return {
        ns: `components/${parts[1]}`,
        clientKey: parts.slice(2).join('.'),
      };
    }
    return { ns: 'common', clientKey: key };
  };

  const i18n = createI18nObject(lang, resolve, normalizeI18nKey);

  const localeConfig: LocaleConfig | undefined = LOCALES.find(
    (l) => l.code === lang,
  );

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
    localeStorageKey: LOCALE_STORAGE_KEY,
    locales: LOCALES.map((l) => ({
      ...l,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag.toLowerCase(),
    })),
    clientI18nScript,
    page_id: name,
    global: (() => {
      const globalData = loadGlobalData(resolveRoot(`${PATHS.SRC}/data`));
      if (process.env.SITE_NAME) globalData.site_name = process.env.SITE_NAME;
      if (process.env.SITE_DESCRIPTION) globalData.site_description = process.env.SITE_DESCRIPTION;
      if (process.env.SOCIAL_GITHUB || process.env.SOCIAL_TWITTER) {
        globalData.social = { ...globalData.social as Record<string, string> };
        if (process.env.SOCIAL_GITHUB) globalData.social.github = process.env.SOCIAL_GITHUB;
        if (process.env.SOCIAL_TWITTER) globalData.social.twitter = process.env.SOCIAL_TWITTER;
      }
      return globalData;
    })(),
    page: readJSON5(resolveRoot(`${PATHS.SRC}/pages/${name}/index.json5`)),
    i18n,
  };
};
