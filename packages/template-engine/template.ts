import fs from 'node:fs';
import { join } from 'pathe';
import { fontsConfig } from '@config/fonts';
import { i18nConfig } from '@config/i18n';
import { ASSET_PATHS } from '@core/asset-paths';
import { env } from '@generated/env';
import type { I18nTranslationKeys } from '@generated/i18n';
import { IMAGE_MANIFEST } from '@generated/image-manifest';
import { lookup } from '@generated/paths';
import {
  convertCurrency,
  convertLocalPrice,
  DEFAULT_NAMESPACE,
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
  getActiveLocales,
  getActiveLocalesDisplay,
  getPluralSuffix,
  localPrice,
  localPriceCurrency,
  plural,
  setLocale,
  setStrategies,
  singular,
  toNativeDigits,
} from '@web-pages-starter/i18n';
import type {
  CardinalOptions,
  I18nItem,
  RegionalPrice,
  RelativeTimeOptions,
  TemplateFormatOptions,
  TemplateParams,
} from '@web-pages-starter/i18n/config/types';
import { CSP_NONCE_PLACEHOLDER } from '@web-pages-starter/i18n/constants';
import type { CurrencyCode } from '@web-pages-starter/i18n/data/currencies';
import type { LocaleCode, LocaleConfig } from '@web-pages-starter/i18n/data/locales';
import { cardinal as arCardinal, ordinal as arOrdinal } from '@web-pages-starter/i18n/strategies/ar';
import { cardinal as idCardinal, ordinal as idOrdinal } from '@web-pages-starter/i18n/strategies/id';
import { cardinal as jaCardinal, ordinal as jaOrdinal } from '@web-pages-starter/i18n/strategies/ja';
import { cardinal as zhCardinal } from '@web-pages-starter/i18n/strategies/zh';
import { loadSharedLocales } from '@web-pages-starter/i18n/utils';
import { getRootPageSlug } from '@web-pages-starter/page-system';
import { getValueByPath } from '@utils/common';
import { loadGlobalData, readJSON5 } from '@core/json5';
import type { DateValue, JsonData } from '@utils/types';

setStrategies(
  { id: idCardinal, ja: jaCardinal, zh: zhCardinal, ar: arCardinal },
  { id: idOrdinal, ja: jaOrdinal, ar: arOrdinal },
);

const escapeHtmlAttr = (value: string | number | boolean): string => String(value).replace(/"/g, '&quot;');

let cachedFontPreloadUrl: string | null | undefined;

const getFontPreloadUrl = (): string | null => {
  if (cachedFontPreloadUrl !== undefined) return cachedFontPreloadUrl;
  const fontName = fontsConfig.sans?.name;
  if (!fontName) {
    cachedFontPreloadUrl = null;
    return null;
  }
  try {
    const fontsCssPath = lookup('@public', ...ASSET_PATHS.fontsCss.split('/'));
    if (!fs.existsSync(fontsCssPath)) {
      cachedFontPreloadUrl = null;
      return null;
    }
    const escaped = fontName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fontsCss = fs.readFileSync(fontsCssPath, 'utf-8');
    const woff2Match = fontsCss.match(
      new RegExp(`url\\(['"]?(\\.\\/[^'"]*${escaped}-latin-wght-normal\\.woff2)['"]?\\)`),
    );
    cachedFontPreloadUrl = woff2Match ? `/${ASSET_PATHS.fonts}/${woff2Match[1].replace('./', '')}` : null;
  } catch {
    cachedFontPreloadUrl = null;
  }
  return cachedFontPreloadUrl;
};

const warnedKeys = new Set<string>();

const i18nScriptCache = new Map<string, { hash: string; script: string }>();

const hashCache = new Map<string, { hash: string; ts: number }>();
const HASH_TTL = 5000;

const hashLocales = (name: string, sharedLocales: string[]): string => {
  const cacheKey = `${name}:${sharedLocales.join(',')}`;
  const now = Date.now();
  const cached = hashCache.get(cacheKey);
  if (cached && now - cached.ts < HASH_TTL) return cached.hash;

  const parts: string[] = [];
  for (const locale of getActiveLocales()) {
    const files = [
      lookup('@locales', locale.code, 'common.json'),
      lookup('@locales', locale.code, `${name}.json`),
      ...sharedLocales.map((sharedLocaleName) => lookup('@locales', locale.code, `${sharedLocaleName}.json`)),
    ];
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf-8');
        let h = 0;
        for (let i = 0; i < content.length; i++) {
          h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
        }
        parts.push(String(h));
      } catch {
        parts.push('0');
      }
    }
  }
  const hash = parts.join('|');
  hashCache.set(cacheKey, { hash, ts: now });
  return hash;
};

export const scanSharedLocales = (
  templatePath: string,
  pageId: string,
  found = new Set<string>(),
  scanned = new Set<string>(),
): string[] => {
  if (scanned.has(templatePath)) return [...found];
  scanned.add(templatePath);
  if (!fs.existsSync(templatePath)) {
    console.warn(`[template] Template not found: ${templatePath}`);
    return [...found];
  }

  const content = fs.readFileSync(templatePath, 'utf-8');

  const keyRegex = /i18n\.\w+\(\s*['"]([^'"]+)['"]/g;
  for (const match of content.matchAll(keyRegex)) {
    const key = match[1];
    const colonIdx = key.indexOf(':');
    if (colonIdx !== -1) {
      const ns = key.slice(0, colonIdx);
      if (ns !== DEFAULT_NAMESPACE && ns !== pageId) found.add(ns);
    }
  }

  const includeRegex = /(?:include|import|extends)\s+['"]([^'"]+\.njk)['"]/g;
  for (const match of content.matchAll(includeRegex)) {
    for (const dir of ['pages', 'layouts', '.']) {
      const candidate = lookup('@', dir, match[1]);
      if (fs.existsSync(candidate)) {
        scanSharedLocales(candidate, pageId, found, scanned);
        break;
      }
    }
  }

  return [...found];
};

const generateClientI18nScript = (
  lang: string,
  name: string,
  sharedLocales: string[],
  supportedLangs: readonly string[],
  LOCALE_STORAGE_KEY: string,
  locales: Array<{ code: string; dir: string; writingSystem: string }>,
  nonce?: string,
): string => {
  const cacheKey = name;
  const hash = hashLocales(name, sharedLocales);
  const cached = i18nScriptCache.get(cacheKey);
  let script = cached && cached.hash === hash ? cached.script : null;
  if (!script) {
    const allI18nData = Object.fromEntries(
      supportedLangs.map((localeCode) => [
        localeCode,
        {
          common: readJSON5(lookup('@locales', localeCode, 'common.json')),
          [name]: readJSON5(lookup('@locales', localeCode, `${name}.json`)),
          ...loadSharedLocales(localeCode, sharedLocales, lookup('@locales')),
        },
      ]),
    ) as Record<string, JsonData>;

    const dir = lookup('@public', ASSET_PATHS.locales, name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    for (const [localeCode, data] of Object.entries(allI18nData)) {
      const json = JSON.stringify(data);
      const filePath = join(dir, `${localeCode}.json`);
      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, json, 'utf-8');
      fs.renameSync(tmpPath, filePath);
    }

    const initialI18nData = JSON.stringify(allI18nData[lang]);

    script = `<script>
(() => {
  const defaultLocale = ${JSON.stringify(lang)};

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathLocale = pathParts[0]?.match(/^[a-z]{2}(-[A-Z]{2})?$/)?.[0];
  const activeCodes = ${JSON.stringify(supportedLangs)};

  const stored = localStorage.getItem('${LOCALE_STORAGE_KEY}');
  const savedLocale = [stored, pathLocale].find(l => l && activeCodes.includes(l)) || defaultLocale;
  if (stored && stored !== savedLocale) localStorage.setItem('${LOCALE_STORAGE_KEY}', savedLocale);
  const locales = ${JSON.stringify(locales)};

  window.__PAGE_ID__ = ${JSON.stringify(name)};
  window.__SAVED_LOCALE__ = savedLocale;
  window.__SERVER_LOCALE__ = defaultLocale;
  window.__CSP_NONCE__ = undefined;
  window.__INITIAL_I18N_DATA__ = ${initialI18nData};

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
  })();\n  </script>`;

    i18nScriptCache.set(cacheKey, { hash, script });
  }
  if (nonce) {
    script = script.replace('<script>', `<script nonce="${nonce}">`);
  }
  return script;
};

const createI18nObject = (
  localeCode: LocaleCode,
  resolveFn: (jsonPath: string, vars?: Record<string, unknown>) => string,
  normalizeI18nKey: (key: string) => { ns: string; clientKey: string },
) => {
  setLocale(localeCode);

  const createItem = (key: string | undefined, vars: Record<string, unknown> = {}): I18nItem => {
    if (!key) {
      return {
        value: `[missing_key: undefined]`,
        key: 'common:site_name' as I18nTranslationKeys,
        vars: null,
      };
    }

    const { ns, clientKey } = normalizeI18nKey(key);
    const varsJson = Object.keys(vars).length ? JSON.stringify(vars) : null;

    return {
      value: resolveFn(key, vars),
      key: `${ns}:${clientKey}` as I18nTranslationKeys,
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

  const i18nFn = (key: string | undefined, vars: Record<string, unknown> = {}) => createItem(key, vars);

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
        ? toNativeDigits(item.value, true)
        : options?.universal
          ? item.value
          : toNativeDigits(item.value);

      if (options?.raw) return translated;

      const attrs = buildAttrs(
        { i18n: item.key },
        item.vars?.replace(/"/g, '&quot;'),
        options?.native ? true : undefined,
      );

      if (options?.native) attrs['force-native'] = 'true';
      if (options?.universal) attrs['force-universal'] = 'true';

      return renderHtml(translated, attrs, options?.className);
    },

    html: (key: string | undefined, vars: Record<string, unknown> = {}) => createItem(key, vars).value,

    attr: (key: string | undefined, attrName: string, vars: Record<string, unknown> = {}) => {
      const item = createItem(key, vars);
      return `${attrName}="${item.value}"${key ? ` data-i18n-attr="${attrName}:${item.key}"` : ''}`;
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
      const translated = toNativeDigits(item.value);

      if (options?.raw) return translated;

      const baseItem = createItem(key, mergedVars);
      const attrs = buildAttrs(
        { 'i18n-plural': baseItem.key, 'i18n-count': count },
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

    formatCurrency: (value: number | string, currency: string, options?: TemplateFormatOptions) => {
      const { raw, className, nativeDigits, numberingSystem, ...intlOpts } = options ?? {};
      const formatted = formatCurrency(value, currency, options);
      if (options?.raw) return formatted;
      const attrs = buildAttrs(
        { 'format-currency': value, 'target-currency': currency },
        undefined,
        options?.nativeDigits,
      );
      if (Object.keys(intlOpts).length > 0) attrs['format-opts'] = JSON.stringify(intlOpts);
      return renderHtml(formatted, attrs, options?.className);
    },

    formatPercent: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatPercent(value, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'format-percent': value }, undefined, options?.nativeDigits),
        options?.className,
      );
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
      const attrs: Record<string, string | number | boolean> = {
        'format-date': String(date),
      };
      if (Object.keys(formatOpts).length > 0) attrs['format-opts'] = JSON.stringify(formatOpts);
      return renderHtml(formatted, attrs, options?.className);
    },

    formatTime: (
      date: DateValue,
      preset: 'short' | 'medium' | 'long' | 'full' = 'short',
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatTime(date, { timeStyle: preset });
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-time': String(date), 'time-preset': preset }, options?.className);
    },

    formatDateTime: (date: DateValue, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatDateTime(date, formatOpts as Intl.DateTimeFormatOptions);
      if (options?.raw) return formatted;
      const attrs: Record<string, string | number | boolean> = {
        'format-datetime': String(date),
      };
      if (Object.keys(formatOpts).length > 0) attrs['format-opts'] = JSON.stringify(formatOpts);
      return renderHtml(formatted, attrs, options?.className);
    },

    formatOrdinal: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatOrdinal(value);
      if (options?.raw) return formatted;
      return renderHtml(formatted, { 'format-ordinal': value }, options?.className);
    },

    formatCardinal: (value: number | string, options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatCardinal(value, formatOpts as CardinalOptions);
      if (raw) return formatted;
      return renderHtml(formatted, { 'format-cardinal': value }, className);
    },

    formatScientific: (value: number | string, options?: TemplateFormatOptions) => {
      const formatted = formatScientific(value, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'format-scientific': value }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    formatAbbreviated: (value: number, options?: TemplateFormatOptions) => {
      const { raw, className, nativeDigits, numberingSystem, ...intlOpts } = options ?? {};
      const formatted = formatAbbreviated(value, options);
      if (options?.raw) return formatted;
      const attrs: Record<string, string | number> = { 'format-abbreviated': value };
      if (Object.keys(intlOpts).length > 0) attrs['format-opts'] = JSON.stringify(intlOpts);
      return renderHtml(formatted, attrs, options?.className);
    },

    formatList: (items: string[], options?: TemplateFormatOptions) => {
      const { raw, className, ...formatOpts } = options ?? {};
      const formatted = formatList(items, formatOpts as Intl.ListFormatOptions);
      if (raw) return formatted;
      return renderHtml(
        formatted,
        {
          'format-list': '',
          items: escapeHtmlAttr(JSON.stringify(items)),
        },
        className,
      );
    },

    formatUnit: (value: number | string, unit: string, options?: TemplateFormatOptions) => {
      const formatted = formatUnit(value, unit, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'format-unit': value, unit }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    convertCurrency: (value: number, targetCurrency: string, options?: TemplateFormatOptions) => {
      const formatted = convertCurrency(value, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'convert-currency': value, 'target-currency': targetCurrency }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    localPrice: (plan: RegionalPrice, options?: TemplateFormatOptions) => {
      const formatted = String(localPrice(plan));
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'local-price': escapeHtmlAttr(JSON.stringify(plan.prices)) }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    localPriceCurrency: (plan: RegionalPrice, options?: TemplateFormatOptions) => {
      const formatted = localPriceCurrency(plan);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'local-price': escapeHtmlAttr(JSON.stringify(plan.prices)) }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    convertLocalPrice: (plan: RegionalPrice, targetCurrency: CurrencyCode, options?: TemplateFormatOptions) => {
      const formatted = convertLocalPrice(plan, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          {
            'local-price': escapeHtmlAttr(JSON.stringify(plan.prices)),
            'target-currency': targetCurrency,
          },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
    },

    formatLocalPrice: (plan: RegionalPrice, options?: TemplateFormatOptions) => {
      const formatted = formatLocalPrice(plan, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs({ 'local-price': escapeHtmlAttr(JSON.stringify(plan.prices)) }, undefined, options?.nativeDigits),
        options?.className,
      );
    },

    formatLocalPriceDiscounted: (
      plan: RegionalPrice,
      discountMultiplier: number,
      targetCurrency?: CurrencyCode,
      options?: TemplateFormatOptions,
    ) => {
      const formatted = formatLocalPriceDiscounted(plan, discountMultiplier, targetCurrency, options);
      if (options?.raw) return formatted;
      return renderHtml(
        formatted,
        buildAttrs(
          {
            'local-price': escapeHtmlAttr(JSON.stringify(plan.prices)),
            discount: discountMultiplier,
            'target-currency': targetCurrency,
          },
          undefined,
          options?.nativeDigits,
        ),
        options?.className,
      );
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
      options: RelativeTimeOptions & Pick<TemplateFormatOptions, 'raw' | 'className'>,
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
  LOCALE_CODES: readonly string[],
  route?: { slug: string; data: Record<string, unknown> },
) => {
  const lang = i18nConfig.defaultLocale;
  const folderName = String(params.entryName || getRootPageSlug(lang));
  const pageData = readJSON5(lookup('@pages', folderName, 'data.json5'));
  const pageId = String(pageData.page_id || folderName);
  const sharedLocales = scanSharedLocales(lookup('@pages', folderName, 'index.njk'), pageId);

  const mergedLocales: JsonData = {
    common: readJSON5(lookup('@locales', lang, 'common.json')),
    [pageId]: readJSON5(lookup('@locales', lang, `${pageId}.json`)),
    ...loadSharedLocales(lang, sharedLocales, lookup('@locales')),
  };

  const resolveKeyToPath = (key: string): string => {
    if (key.includes(':')) return key.replaceAll(':', '.');
    return `common.${key}`;
  };

  const resolve = (key: string, vars: Record<string, unknown> = {}): string => {
    const jsonPath = resolveKeyToPath(key);
    const val = getValueByPath(mergedLocales, jsonPath);
    let str = val !== undefined ? String(val) : key;

    if (val === undefined && !env.IS_PROD && !warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(`[i18n] Missing key "${key}" in locale "${lang}"`);
    }

    for (const [k, value] of Object.entries(vars)) {
      str = str.replaceAll(`{{${k}}}`, String(value));
    }
    return str;
  };

  const normalizeI18nKey = (key: string): { ns: string; clientKey: string } => {
    const colonIdx = key.indexOf(':');
    if (colonIdx !== -1) {
      return { ns: key.slice(0, colonIdx), clientKey: key.slice(colonIdx + 1) };
    }
    return { ns: DEFAULT_NAMESPACE, clientKey: key };
  };

  const i18n = createI18nObject(lang, resolve, normalizeI18nKey);

  const localeConfig: LocaleConfig | undefined = getActiveLocales().find((l) => l.code === lang);

  const isSingleLocale = LOCALE_CODES.length <= 1;

  const cspNonce = CSP_NONCE_PLACEHOLDER;

  const basePath = env.BASE_PATH;

  const clientI18nScript = isSingleLocale
    ? `<script nonce="${cspNonce}">window.__SERVER_LOCALE__=${JSON.stringify(lang)};window.__SAVED_LOCALE__=${JSON.stringify(lang)};window.__BASE_PATH__=${JSON.stringify(basePath)};window.__CSP_NONCE__=undefined;</script>`
    : generateClientI18nScript(
        lang,
        pageId,
        sharedLocales,
        LOCALE_CODES,
        LOCALE_STORAGE_KEY,
        getActiveLocales().map((l) => ({
          code: l.code,
          dir: l.dir,
          writingSystem: l.writingSystem,
        })),
        cspNonce,
      );

  const url = (path: string): string => {
    if (
      path.startsWith('http') ||
      path.startsWith('//') ||
      path.startsWith('#') ||
      path.startsWith('mailto:') ||
      path.startsWith('tel:')
    )
      return path;
    const clean = path.replace(/\/+/g, '/').replace(/\/$/, '') || '';
    const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
    if (clean === '' || clean === '/') return base;
    const hasAnchor = clean.includes('#');
    const [beforeHash, afterHash] = hasAnchor ? clean.split('#', 2) : [clean, ''];
    const result = `${base}${beforeHash}`.replace(/\/+/g, '/');
    return hasAnchor ? `${result}#${afterHash}` : result;
  };

  const globalData = (() => {
    const data = loadGlobalData(lookup('@data'));
    data.site_url = env.SITE_URL;
    return data;
  })();

  const dnsPrefetch = [
    ...((globalData.dns_prefetch as string[]) ?? []),
    ...((pageData?.dns_prefetch as string[]) ?? []),
  ];

  const preconnect = [
    ...((globalData.preconnect as Array<{ href: string; crossorigin?: boolean }>) ?? []),
    ...((pageData?.preconnect as Array<{ href: string; crossorigin?: boolean }>) ?? []),
  ];

  const domains = preconnect.map((h) => h.href);

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${cspNonce}'`,
    `style-src 'self' 'nonce-${cspNonce}' 'unsafe-inline'`,
    `img-src 'self' data: ${domains.join(' ')}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
  ].join('; ');

  return {
    ...params,
    currentYear: new Date().getFullYear(),
    lang,
    localeConfig,
    localeStorageKey: LOCALE_STORAGE_KEY,
    locales: getActiveLocalesDisplay(),
    LOCALE_CODES,
    clientI18nScript,
    csp_nonce: cspNonce,
    csp,
    dns_prefetch: dnsPrefetch,
    preconnect,
    font_preload_url: getFontPreloadUrl(),
    page_id: pageId,
    route,
    global: globalData,
    page: pageData,
    i18n,
    url,
    base_path: basePath,
    images: IMAGE_MANIFEST,
  };
};
