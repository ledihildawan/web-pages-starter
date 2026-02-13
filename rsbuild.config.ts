import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { type Compilation, type Compiler, CopyRspackPlugin } from '@rspack/core';
import tailwindcss from '@tailwindcss/postcss';
import { minify } from 'html-minifier-terser';

// --- Definisi Tipe Data Eksplisit ---
interface I18nResult {
  v: string;
  k: string;
  vars: string | null;
}

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
type JsonData = Record<string, JsonValue>;

// --- Helper Functions ---
const isProd = process.env.NODE_ENV === 'production';
const shouldMinify = isProd && process.env.MINIFY !== 'false';
const shouldMinifyHTML = shouldMinify && process.env.MINIFY_HTML !== 'false';
const ROOT = process.cwd();
const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

const MANAGED_EXTS = ['ts', 'css', 'njk', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

const readJSON = (filePath: string): JsonData => {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JsonData;
  } catch {
    return {};
  }
};

const loadGlobalData = (): JsonData => {
  const dir = resolveRoot('src/data');
  const globalData: JsonData = {};
  if (!fs.existsSync(dir)) return globalData;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const name = path.basename(file, '.json');
      const data = readJSON(path.join(dir, file));
      if (name === 'global') {
        Object.assign(globalData, data);
      } else {
        globalData[name] = data;
      }
    }
  }
  return globalData;
};

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
  const scripts = [resolveRoot('src/scripts/main.ts'), resolveRoot('src/styles/main.css')];
  return scripts.filter((p) => fs.existsSync(p));
};

const WatchJsonPlugin = {
  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tap('WatchJsonPlugin', (compilation: Compilation) => {
      ['data', 'pages', 'locales'].forEach((d) => {
        const full = resolveRoot('src', d);
        if (fs.existsSync(full)) {
          const files = fs.readdirSync(full, { recursive: true }) as string[];
          files
            .filter((f) => f.endsWith('.json'))
            .forEach((f) => {
              compilation.fileDependencies.add(path.join(full, f));
            });
        }
      });
    });
  },
};

const getValueByPath = (obj: JsonData, path: string): JsonValue | undefined => {
  return path.split('.').reduce((prev: JsonValue | undefined, curr: string) => {
    if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
      return (prev as Record<string, JsonValue>)[curr];
    }
    return undefined;
  }, obj);
};

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

  plugins: [
    pluginImageCompress(
      { use: 'jpeg', quality: 60 },
      { use: 'png' },
      { use: 'webp', quality: 60 },
    ),
  ],

  dev: {
    client: { overlay: true, reconnect: 5 },
    watchFiles: {
      paths: [
        'src/**/*.njk',
        'src/data/**/*.json',
        'src/pages/**/*.json',
        'src/locales/**/*.json',
        'src/**/*.css',
      ],
      options: { usePolling: true, interval: 100 },
      type: 'reload-page',
    },
  },

  resolve: {
    alias: (() => {
      const aliases: Record<string, string> = { '@': resolveRoot('src') };
      ['data', 'pages', 'assets', 'layouts'].forEach((dir) => {
        aliases[`@${dir}`] = resolveRoot('src', dir);
      });
      return aliases;
    })(),
  },

  source: {
    preEntry: getGlobalEntries(),
    entry: getEntries(),
  },

  output: {
    distPath: { js: 'assets/scripts', css: 'assets/styles', image: 'assets/images' },
    assetPrefix: './',
    cleanDistPath: true,
    minify: shouldMinify,
    sourceMap: !shouldMinify ? { js: 'cheap-module-source-map', css: true } : false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      image: '[name].[hash:8][ext]',
    },
  },

  html: {
    template: ({ entryName }) => path.join('src/pages', entryName, 'index.njk'),
    templateParameters: (params) => {
      const name = String(params.entryName || 'home');
      const lang = 'id';

      // 1. Load Locales
      const rawPageLocales = readJSON(resolveRoot(`src/locales/${lang}/${name}.json`));
      const commonLocales = readJSON(resolveRoot(`src/locales/${lang}/common.json`));

      // 2. Wrap Page Locales dalam scope 'page' untuk menghindari tabrakan dengan common
      const mergedLocales: JsonData = {
        ...commonLocales,
        page: rawPageLocales
      };

      // 3. Load Data Struktur
      const globalData = loadGlobalData();
      const pageData = readJSON(resolveRoot('src/pages', name, 'index.json'));

      const _resolve = (jsonPath: string, variables: Record<string, unknown> = {}): string => {
        let val: JsonValue | undefined = getValueByPath(mergedLocales, jsonPath);

        const result = val !== undefined ? String(val) : jsonPath;

        if (typeof result === 'string') {
          let replaced = result;
          Object.keys(variables).forEach((key) => {
            replaced = replaced.replace(
              new RegExp(`{{ *${key} *}}`, 'g'),
              String(variables[key]),
            );
          });
          return replaced;
        }
        return result;
      };

      return {
        ...params,
        page_id: name,
        global: globalData,
        page: pageData,
        /**
         * I18N HELPER DENGAN SCOPE AWARENESS
         * - Gunakan i18n.t('key') untuk common.json
         * - Gunakan i18n.t('page.key') untuk [page].json
         */
        i18n: (key: string, vars: Record<string, unknown> = {}): I18nResult => {
          const isScoped = key.startsWith('page.');
          const namespace = isScoped ? name : 'common';

          // Bersihkan prefix 'page.' untuk pencarian di client-side i18next
          const clientKey = isScoped ? key.replace('page.', '') : key;
          const value = _resolve(key, vars);

          return {
            v: value,
            k: `${namespace}:${clientKey}`,
            vars: Object.keys(vars).length ? JSON.stringify(vars) : null,
          };
        },
      };
    },
  },

  tools: {
    htmlPlugin: (config) => {
      config.minify = (html) =>
        !shouldMinifyHTML
          ? html
          : minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
            minifyURLs: true,
          });
      return config;
    },
    postcss: (config) => {
      config.postcssOptions ??= {};
      const opts = config.postcssOptions as { plugins?: unknown[] };
      opts.plugins ??= [];
      opts.plugins.push(tailwindcss());
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
            { from: resolveRoot('src/locales'), to: 'locales', noErrorOnMissing: true },
          ],
        }),
        WatchJsonPlugin,
      ],
      module: {
        rules: [
          {
            test: /\.njk$/,
            use: [
              {
                loader: 'simple-nunjucks-loader',
                options: {
                  searchPaths: ['pages', 'layouts', ''].map((d) => resolveRoot('src', d)),
                  assetsPaths: [resolveRoot('src/assets')],
                },
              },
            ],
          },
        ],
      },
    },
  },
});