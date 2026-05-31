import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { minify } from 'html-minifier-terser';
import pluralize from 'pluralize';
import type { I18nTranslationKeys } from './generated/i18n';
import {
  BASE_CURRENCY,
  DEFAULT_LANG,
  LANGUAGES,
  SUPPORTED_LANG_CODES,
} from './src/configs/locales';
import { EXCHANGE_RATES, convertCurrency as convertCurrencyRaw } from './generated/exchange-rates';
import { getValueByPath, jsonAttr } from './src/scripts/utils/common';
import * as intl from './src/scripts/utils/intl';
import { readJson5File } from './tools/parse-json5';
import { getPluralSuffix, getFallbackChain } from './src/scripts/utils/locale';
import type { DateTimePreset } from '@/types/common';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type JsonData = Record<string, JsonValue>;

const ROOT = process.cwd();
const isProd = process.env.NODE_ENV === 'production';
const shouldMinify = isProd && process.env.MINIFY !== 'false';
const shouldMinifyHTML = shouldMinify && process.env.MINIFY_HTML !== 'false';

const MANAGED_EXTS = [
  'ts',
  'css',
  'njk',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'gif',
];

const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

const readJSON5 = (filePath: string): JsonData => {
  try {
    let finalPath = filePath;
    if (!fs.existsSync(finalPath)) {
      finalPath = filePath.replace(/\.json5$/, '.json');
      if (!fs.existsSync(finalPath)) return {};
    }
    return readJson5File(finalPath) as JsonData;
  } catch (err) {
    console.warn(`[JSON5 Read Error]: ${filePath}`, err);
    return {};
  }
};

const loadGlobalData = (): JsonData => {
  const dir = resolveRoot('src/data');
  const globalData: JsonData = {};

  if (!fs.existsSync(dir)) return globalData;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.json5') || file.endsWith('.json')) {
      const name = file.replace(/\.json5?$/, '');
      const data = readJSON5(path.join(dir, file));

      if (name === 'global') {
        Object.assign(globalData, data);
      } else {
        globalData[name] = data;
      }
    }
  }
  return globalData;
};

const loadSelectedComponentLocales = (
  lang: string,
  selected: string[],
): JsonData => {
  const compData: JsonData = {};
  for (const name of selected) {
    const data = readJSON5(
      resolveRoot(`src/locales/${lang}/components/${name}.json5`),
    );
    if (Object.keys(data).length > 0) {
      compData[name] = data;
    }
  }
  return compData;
};

const getUsedComponents = (
  templatePath: string,
  found = new Set<string>(),
): string[] => {
  if (!fs.existsSync(templatePath)) return Array.from(found);

  const content = fs.readFileSync(templatePath, 'utf-8');
  const componentRegex =
    /(?:include|import|extends)\s+['"](?:components\/)?([\w-]+)\.njk['"]/g;

  let match = componentRegex.exec(content);
  while (match !== null) {
    const compName = match[1];
    if (!found.has(compName)) {
      const compPath = resolveRoot(`src/components/${compName}.njk`);
      if (fs.existsSync(compPath)) {
        found.add(compName);
        getUsedComponents(compPath, found);
      }
    }
    match = componentRegex.exec(content);
  }

  return Array.from(found);
};

const getEntries = (): Record<string, string | string[]> => {
  const dir = resolveRoot('src/pages');
  const entries: Record<string, string | string[]> = {};

  if (!fs.existsSync(dir)) return entries;

  for (const folder of fs.readdirSync(dir)) {
    const tsFile = path.join(dir, folder, 'index.ts');
    const cssFile = path.join(dir, folder, 'index.css');

    if (fs.existsSync(tsFile)) {
      entries[folder] = fs.existsSync(cssFile) ? [tsFile, cssFile] : tsFile;
    }
  }
  return entries;
};

const getGlobalEntries = (): string[] => {
  return [
    resolveRoot('src/scripts/main.ts'),
    resolveRoot('src/styles/main.css'),
  ].filter((p) => fs.existsSync(p));
};

export default defineConfig({
  server: {
    open: '/',
    port: 8888,
    strictPort: true,
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/home.html' },
        { from: /./, to: '/404.html' },
      ],
      disableDotRule: true,
    },
  },

  dev: {
    client: { overlay: true, reconnect: 5 },
    watchFiles: {
      paths: [
        'src/**/*.njk',
        'src/**/*.json',
        'src/**/*.json5',
        'src/**/*.css',
      ],
      options: { usePolling: true, interval: 100 },
      type: 'reload-page',
    },
  },

  resolve: {
    alias: {
      '@': resolveRoot('src'),
      '@components': resolveRoot('src/components'),
      '@assets': resolveRoot('src/assets'),
      '@generated': resolveRoot('generated'),
      '@configs': resolveRoot('src/configs'),
    },
  },

  source: {
    preEntry: getGlobalEntries(),
    entry: getEntries(),
  },

  output: {
    distPath: {
      js: 'assets/scripts',
      css: 'assets/styles',
      image: 'assets/images',
      font: 'assets/fonts',
    },
    assetPrefix: '/',
    cleanDistPath: true,
    minify: shouldMinify,
    inlineStyles: ({ size }) => size < 20 * 1_024,
    inlineScripts: ({ size }) => size < 8 * 1_024,
    sourceMap: !shouldMinify
      ? { js: 'cheap-module-source-map', css: true }
      : false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      font: '[name][ext]',
      image: '[name].[hash:8][ext]',
    },
    legalComments: 'none',
    copy: [
      {
        from: resolveRoot('src/assets'),
        to: 'assets',
        globOptions: { ignore: MANAGED_EXTS.map((ext) => `**/*.${ext}`) },
        noErrorOnMissing: true,
      },
    ],
  },

  plugins: [
    pluginImageCompress(
      { use: 'avif', quality: 75 }
    ),
  ],

  tools: {
    htmlPlugin: (config) => {
      config.minify = (html) =>
        !shouldMinifyHTML
          ? html
          : minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            decodeEntities: true,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            continueOnParseError: true,
            customEventAttributes: [/^on[a-z]{3,}$/],
            removeAttributeQuotes: false,
            keepClosingSlash: true,
            ignoreCustomFragments: [
              /\{\{[\s\S]*?\}\}/,
              /\{%[\s\S]*?%\}/,
              /\{#[\s\S]*?#\}/,
            ],
            conservativeCollapse: true,
            collapseInlineTagWhitespace: false,
            removeEmptyAttributes: false,
          });

      return config;
    },
    rspack: {
      module: {
        rules: [
          {
            test: /\.njk$/,
            use: [
              {
                loader: 'simple-nunjucks-loader',
                options: {
                  searchPaths: ['pages', 'layouts', 'components', ''].map((d) =>
                    resolveRoot('src', d),
                  ),
                  assetsPaths: [resolveRoot('src/assets')],
                  configureLocal: (njk: any) => {
                    // Add slice filter for Nunjucks
                    njk.addFilter('slice', (arr: any[], start: number, end?: number) => {
                      if (!Array.isArray(arr)) return arr;
                      return end !== undefined ? arr.slice(start, end) : arr.slice(start);
                    });
                    // Add truncate filter
                    njk.addFilter('truncate', (str: string, length: number, killwords = false) => {
                      if (typeof str !== 'string') return str;
                      if (str.length <= length) return str;
                      const trimmed = str.trim();
                      if (killwords) {
                        return trimmed.substring(0, length);
                      }
                      const spaceIndex = trimmed.lastIndexOf(' ', length);
                      if (spaceIndex === -1) return trimmed.substring(0, length);
                      return trimmed.substring(0, spaceIndex) + '...';
                    });
                  },
                },
              },
            ],
          },
        ],
      },
    },
  },

  html: {
    inject: 'head',
    scriptLoading: 'defer',
    template: ({ entryName }) => path.join('src/pages', entryName, 'index.njk'),

    templateParameters: (params) => {
      const name = String(params.entryName || 'home');
      const lang = DEFAULT_LANG;
      const templatePath = resolveRoot(`src/pages/${name}/index.njk`);

      const usedComponents = getUsedComponents(templatePath);
      const supportedLangs = SUPPORTED_LANG_CODES;

      const mergedLocales: JsonData = {
        ...readJSON5(resolveRoot(`src/locales/${lang}/common.json5`)),
        page: readJSON5(resolveRoot(`src/locales/${lang}/${name}.json5`)),
        comp: loadSelectedComponentLocales(lang, usedComponents),
      };

      const allI18nData: Record<string, JsonData> = {};
      for (const l of supportedLangs) {
        allI18nData[l] = {
          common: readJSON5(resolveRoot(`src/locales/${l}/common.json5`)),
          comp: loadSelectedComponentLocales(l, usedComponents),
          page: readJSON5(resolveRoot(`src/locales/${l}/${name}.json5`)),
        };
      }

      const clientI18nScript = `
        <script>
          (() => {
            const defaultLng = "${lang}";
            const savedLng = localStorage.getItem('i18nextLng') || defaultLng;
            const languages = ${JSON.stringify(LANGUAGES)};

            window.__PAGE_ID__ = ${JSON.stringify(name)};
            window.__USED_COMPONENTS__ = ${JSON.stringify(usedComponents)};
            window.__I18N_DATA__ = ${JSON.stringify(allI18nData)};
            window.__SAVED_LNG__ = savedLng;

            const htmlEl = document.documentElement;
            const langConfig = languages.find(l => l.code === savedLng);
            const dir = langConfig?.dir || 'ltr';

            htmlEl.setAttribute('dir', dir);
            htmlEl.setAttribute('lang', savedLng);

            if (dir === 'rtl') {
              htmlEl.classList.add('is-rtl');
            } else {
              htmlEl.classList.remove('is-rtl');
            }
          })();
        </script>
      `;

      const globalData = loadGlobalData();
      const pageData = readJSON5(resolveRoot('src/pages', name, 'index.json5'));

      const isDev = process.env.NODE_ENV !== 'production';

      const _resolve = (
        jsonPath: string,
        vars: Record<string, unknown> = {},
      ): string => {
        const val = getValueByPath(mergedLocales, jsonPath);
        let str = val !== undefined ? String(val) : jsonPath;

        if (val === undefined && isDev) {
          console.warn(`[i18n] Missing key "${jsonPath}" in locale "${lang}"`);
        }

        for (const key of Object.keys(vars)) {
          str = str.split(`{{${key}}}`).join(String(vars[key]));
        }
        return str;
      };

      const normalizeI18nKey = (key: string): { ns: string; clientKey: string } => {
        let ns = 'common';
        let clientKey = key;

        if (key.startsWith('page.')) {
          ns = name;
          clientKey = key.replace('page.', '');
        } else if (key.startsWith('comp.')) {
          const p = key.split('.');
          ns = `components/${p[1]}`;
          clientKey = p.slice(2).join('.');
        }

        return { ns, clientKey };
      };

      const i18nItem = (key: string | undefined, vars: Record<string, unknown> = {}) => {
        if (!key) {
          return {
            v: `[missing_key]`,
            k: 'common:site_name' as I18nTranslationKeys,
            vars: null,
          };
        }

        const { ns, clientKey } = normalizeI18nKey(key);

        return {
          v: _resolve(key, vars),
          k: `${ns}:${clientKey}` as I18nTranslationKeys,
          vars: Object.keys(vars).length ? JSON.stringify(vars) : null,
        };
      };

      return {
        ...params,
        lang,
        clientI18nScript,
        page_id: name,
        global: globalData,
        page: pageData,
        nunjucksFilters: {
          jsonAttr,
          dump: (value: unknown) => JSON.stringify(value),
          formatNumber: (value: number, lng: string, options?: Intl.NumberFormatOptions, useNative?: boolean) =>
            intl.formatNumber(value, lng, options, { useNativeNumberingSystem: useNative }),
          formatPercent: (value: number, lng: string, options?: Intl.NumberFormatOptions, useNative?: boolean) =>
            intl.formatPercent(value, lng, options, { useNativeNumberingSystem: useNative }),
          formatBytes: intl.formatBytes as (bytes: number, decimals?: number) => string,
          formatDuration: intl.formatDuration as (seconds: number, lng: string) => string,
          formatDate: intl.formatDate as (date: DateTimePreset, lng: string, options?: Intl.DateTimeFormatOptions) => string,
          formatDateTime: intl.formatDateTime as (date: DateTimePreset, lng: string, options?: Intl.DateTimeFormatOptions) => string,
          formatOrdinal: (value: number) => intl.formatOrdinal(value, lang),
          formatCardinal: (value: number) => intl.formatCardinal(value, lang),
          formatScientific: (value: number, options?: Intl.NumberFormatOptions, useNative?: boolean) =>
            intl.formatScientific(value, lang, options, { useNativeNumberingSystem: useNative }),
          formatAbbreviated: (value: number) => intl.formatAbbreviated(value, lang),
          formatList: (items: string[]) => Array.isArray(items) ? intl.formatList(items, lang) : String(items),
          formatCurrency: (value: number, lng: string, currency?: string, options?: Intl.NumberFormatOptions, useNative?: boolean) =>
            intl.formatCurrency(value, lng, currency ?? BASE_CURRENCY, options, { useNativeNumberingSystem: useNative }),
          formatUnit: (value: number, lng: string, unit: string, options?: Intl.NumberFormatOptions, useNative?: boolean) =>
            intl.formatUnit(value, lng, unit, options, { useNativeNumberingSystem: useNative }),
          formatTime: (date: DateTimePreset, lng: string, preset?: DateTimePreset) =>
            intl.formatTime(date, lng, preset ?? 'short'),
          formatDatePreset: (date: DateTimePreset, lng: string, preset?: DateTimePreset) =>
            intl.formatDatePreset(date, lng, preset ?? 'medium'),
          getPluralSuffix,
          convertCurrency: (value: number, lng: string, targetCurrency?: string, options?: Intl.NumberFormatOptions, useNative?: boolean) => {
            const currency = targetCurrency || LANGUAGES.find((l) => l.code === lng)?.currency || BASE_CURRENCY;
            const converted = convertCurrencyRaw(value, BASE_CURRENCY, currency, EXCHANGE_RATES);
            return intl.formatCurrency(converted, lng, currency, options, { useNativeNumberingSystem: useNative });
          },
          getLocalPrice: (plan: { pricing: { base: number; [locale: string]: number } }, lng: string) => {
            return intl.getLocalPrice(plan, lng);
          },
          getLocalPriceCurrency: (plan: { pricing: { base: number; [locale: string]: number } }, lng: string) => {
            return intl.getLocalPriceCurrency(plan, lng);
          },
          convertLocalPrice: (plan: { pricing: { base: number; [locale: string]: number } }, lng: string, targetCurrency?: string, options?: Intl.NumberFormatOptions) => {
            const price = intl.getLocalPrice(plan, lng);
            const fromCurrency = intl.getLocalPriceCurrency(plan, lng);
            const toCurrency = targetCurrency || LANGUAGES.find((l) => l.code === lng)?.currency || BASE_CURRENCY;
            if (fromCurrency === toCurrency) {
              return intl.formatCurrency(price, lng, toCurrency, options);
            }
            const converted = convertCurrencyRaw(price, fromCurrency, toCurrency, EXCHANGE_RATES);
            return intl.formatCurrency(converted, lng, toCurrency, options);
          },
          convertLocalPriceDiscounted: (plan: { pricing: { base: number; [locale: string]: number } }, lng: string, discountMultiplier: number, targetCurrency?: string, options?: Intl.NumberFormatOptions) => {
            const price = intl.getLocalPrice(plan, lng) * discountMultiplier;
            const fromCurrency = intl.getLocalPriceCurrency(plan, lng);
            const toCurrency = targetCurrency || LANGUAGES.find((l) => l.code === lng)?.currency || BASE_CURRENCY;
            if (fromCurrency === toCurrency) {
              return intl.formatCurrency(price, lng, toCurrency, options);
            }
            const converted = convertCurrencyRaw(price, fromCurrency, toCurrency, EXCHANGE_RATES);
            return intl.formatCurrency(converted, lng, toCurrency, options);
          },
          pluralize: (word: string, count?: number, inclusive = false) => {
            if (inclusive && count !== undefined) return pluralize(word, count);
            return count === undefined ? pluralize(word) : pluralize(word, count);
          },
          singularize: (word: string) => pluralize.singular(word),
          formatRelativeTime: (value: number, lng: string, unit: Intl.RelativeTimeFormatUnit) => {
            try {
              return new Intl.RelativeTimeFormat(lng, { numeric: 'auto' }).format(value, unit);
            } catch {
              return `${value} ${unit}`;
            }
          },
          nativeNumbers: (text: string, lng: string, force?: boolean) => intl.toNativeDigits(text, lng, force),
        },
        i18n: i18nItem,
        i18nPlural: (key: string | undefined, count: number, vars: Record<string, unknown> = {}) => {
          if (!key) return i18nItem(key, vars);
          const mergedVars = { ...vars, count };
          const lookupKey = `${key}${getPluralSuffix(count, lang)}`;
          const item = i18nItem(lookupKey, mergedVars);
          const { ns, clientKey } = normalizeI18nKey(key);

          return {
            ...item,
            k: `${ns}:${clientKey}` as I18nTranslationKeys,
          };
        },
      };
    },
  },
});
