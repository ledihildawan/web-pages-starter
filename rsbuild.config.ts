import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import {
  type Compilation,
  type Compiler,
  CopyRspackPlugin,
} from '@rspack/core';
import { minify } from 'html-minifier-terser';
import JSON5 from 'json5';

// --- Types & Constants ---
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

// --- Helpers ---
const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

const readJSON5 = (filePath: string): JsonData => {
  try {
    let finalPath = filePath;
    if (!fs.existsSync(finalPath)) {
      finalPath = filePath.replace(/\.json5$/, '.json');
      if (!fs.existsSync(finalPath)) return {};
    }
    return JSON5.parse(fs.readFileSync(finalPath, 'utf-8')) as JsonData;
  } catch (err) {
    console.warn(`[JSON5 Read Error]: ${filePath}`, err);
    return {};
  }
};

const getValueByPath = (
  obj: JsonData,
  jsonPath: string,
): JsonValue | undefined => {
  return jsonPath
    .split('.')
    .reduce((prev: JsonValue | undefined, curr: string) => {
      if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
        return (prev as Record<string, JsonValue>)[curr];
      }
      return undefined;
    }, obj);
};

// --- Data Loaders & Scanner ---
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

// --- Entry Resolvers ---
const getEntries = (): Record<string, string | string[]> => {
  const dir = resolveRoot('src/pages');
  const entries: Record<string, string | string[]> = {};
  if (!fs.existsSync(dir)) return entries;

  const folders = fs.readdirSync(dir);
  for (const folder of folders) {
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

// --- Custom Plugins ---
const WatchJson5Plugin = {
  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tap(
      'WatchJson5Plugin',
      (compilation: Compilation) => {
        const watchDirs = ['data', 'pages', 'locales', 'components'];
        for (const d of watchDirs) {
          const full = resolveRoot('src', d);
          if (fs.existsSync(full)) {
            const files = fs.readdirSync(full, { recursive: true }) as string[];
            for (const f of files) {
              const fileStr = f as string;
              if (fileStr.match(/\.(json5?|njk)$/)) {
                compilation.fileDependencies.add(path.join(full, fileStr));
              }
            }
          }
        }
      },
    );
  },
};

// --- Main Config ---
export default defineConfig({
  server: {
    open: '/',
    strictPort: true,
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/home.html' },
        { from: /./, to: '/404.html' },
      ],
      disableDotRule: true,
    },
  },

  performance: {
    chunkSplit: { strategy: 'split-by-experience' },
    removeConsole: shouldMinify,
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
    inlineStyles: ({ size }) => size < 14 * 1024,
    inlineScripts: ({ size }) => size < 5 * 1024,
    sourceMap: !shouldMinify ? { js: 'cheap-module-source-map', css: true } : false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      font: '[name][ext]',
      image: '[name].[hash:8][ext]',
    },
    legalComments: 'none',
  },

  plugins: [
    pluginImageCompress(
      { use: 'jpeg', quality: 70 },
      { use: 'png' },
      { use: 'webp', quality: 70 },
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
            removeEmptyAttributes: true,
            collapseInlineTagWhitespace: true,
            conservativeCollapse: false,
          });
      return config;
    },
    rspack: {
      plugins: [
        new CopyRspackPlugin({
          patterns: [
            {
              from: resolveRoot('src/assets'),
              to: 'assets',
              globOptions: { ignore: MANAGED_EXTS.map((ext) => `**/*.${ext}`) },
              noErrorOnMissing: true,
            },
          ],
        }),
        WatchJson5Plugin,
      ],
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
      const lang = 'id';
      const templatePath = resolveRoot(`src/pages/${name}/index.njk`);

      const usedComponents = getUsedComponents(templatePath);
      const supportedLangs = ['id', 'en', 'ja', 'zh', 'ar'];

      // --- 1. Load data untuk bahasa default (Indonesia) untuk di-render oleh Nunjucks ---
      const mergedLocales: JsonData = {
        ...readJSON5(resolveRoot(`src/locales/${lang}/common.json5`)),
        page: readJSON5(resolveRoot(`src/locales/${lang}/${name}.json5`)),
        comp: loadSelectedComponentLocales(lang, usedComponents),
      };

      // --- 2. Load data untuk bahasa lainnya (Inject ke Window) ---
      const preloadedI18nData: Record<string, JsonData> = {};
      supportedLangs.forEach(l => {
        if (l !== lang) {
          preloadedI18nData[l] = {
            common: readJSON5(resolveRoot(`src/locales/${l}/common.json5`)),
            page: readJSON5(resolveRoot(`src/locales/${l}/${name}.json5`)),
            comp: loadSelectedComponentLocales(l, usedComponents),
          };
        }
      });

      // Inject ID halaman, komponen, dan seluruh JSON ke memori HTML
      const clientI18nScript = `
        <script>
    (function() {
      window.__PAGE_ID__ = ${JSON.stringify(name)};
      window.__USED_COMPONENTS__ = ${JSON.stringify(usedComponents)};
      window.__I18N_DATA__ = ${JSON.stringify({
        ...preloadedI18nData,
        [lang]: mergedLocales
      })};
    })();
  </script>
      `;

      const globalData = loadGlobalData();
      const pageData = readJSON5(resolveRoot('src/pages', name, 'index.json5'));

      const _resolve = (
        jsonPath: string,
        vars: Record<string, unknown> = {},
      ): string => {
        const val = getValueByPath(mergedLocales, jsonPath);
        let str = val !== undefined ? String(val) : jsonPath;
        for (const key of Object.keys(vars)) {
          str = str.split('{{' + key + '}}').join(String(vars[key]));
        }
        return str;
      };

      return {
        ...params,
        lang,
        clientI18nScript,
        page_id: name,
        global: globalData,
        page: pageData,
        i18n: (key: string, vars: Record<string, unknown> = {}) => {
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

          const result = _resolve(key, vars);
          return {
            v: result,
            // Format ini (namespace:key) yang akan dibaca oleh client script di main.njk
            k: `${ns}:${clientKey}`,
            vars: Object.keys(vars).length ? JSON.stringify(vars) : null,
          };
        },
      };
    },
  },
});