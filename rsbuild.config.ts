import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { minify } from 'html-minifier-terser';
import {
  getActiveLocaleCodes,
  LOCALE_STORAGE_KEY,
} from './packages/i18n/index';
import { createTemplateParams } from './packages/i18n/template/template';
import { i18nConfig } from './src/configs/i18n';
import { getRootPageSlug, getSystemPageSlug } from './src/configs/pages';
import { PATHS } from './src/configs/paths';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8888;
const BASE_PATH = process.env.BASE_PATH || '/';
const isProd =
  process.env.NODE_ENV === 'production' || process.env.BUILD_PREVIEW === 'true';
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

const pluginRootPageAsIndex = (): RsbuildPlugin => ({
  name: 'plugin-root-page-as-index',
  setup(api) {
    api.onAfterBuild(() => {
      const distDir = api.context.distPath;
      const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
      const src = path.join(distDir, `${rootSlug}.html`);
      const dest = path.join(distDir, 'index.html');
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    });
  },
});

const EXCLUDED_PAGES = new Set<string>([]);

const getEntries = (): Record<string, string | string[]> => {
  const dir = resolveRoot(PATHS.SRC, 'pages');
  const entries: Record<string, string | string[]> = {};

  if (!fs.existsSync(dir)) return entries;

  for (const folder of fs.readdirSync(dir)) {
    if (EXCLUDED_PAGES.has(folder)) {
      continue;
    }

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
    resolveRoot(PATHS.SRC, 'scripts/main.ts'),
    resolveRoot(PATHS.SRC, 'styles/main.css'),
  ].filter((p) => fs.existsSync(p));
};

export default defineConfig({
  server: {
    port: PORT,
    strictPort: true,
    historyApiFallback: {
      rewrites: [
        {
          from: /^\/$/,
          to: `/${getRootPageSlug(i18nConfig.defaultLocale)}.html`,
        },
        {
          from: /^\/(?!locales\/|assets\/|fonts\/|images\/|favicon\.svg$|favicon\.ico$|manifest\.json$|sw\.js$|robots\.txt$|sitemap\.xml$|.*\.[a-z0-9]+$)/,
          to: `/${getSystemPageSlug('not-found', i18nConfig.defaultLocale)}.html`,
        },
      ],
      disableDotRule: true,
    },
  },
  dev: {
    watchFiles: {
      paths: ['src/**/*.njk', 'src/**/*.json', 'src/**/*.json5'],
      type: 'reload-page',
    },
  },
  splitChunks: {
    preset: 'default',
  },
  resolve: {
    alias: {
      '@': resolveRoot(PATHS.SRC),
      '@shared': resolveRoot(PATHS.SRC, 'shared'),
      '@assets': resolveRoot(PATHS.SRC, 'assets'),
      '@generated': resolveRoot(PATHS.GENERATED),
      '@configs': resolveRoot(PATHS.SRC, 'configs'),
      '@data': resolveRoot(PATHS.SRC, 'data'),
      '@i18n': resolveRoot('packages', 'i18n'),
      '@core': resolveRoot('packages', 'core'),
    },
  },
  source: {
    preEntry: getGlobalEntries(),
    entry: getEntries(),
    define: {
      'import.meta.env.BASE_PATH': JSON.stringify(BASE_PATH),
    },
  },
  output: {
    distPath: {
      js: 'assets/scripts',
      css: 'assets/styles',
      image: 'assets/images',
      font: 'assets/fonts',
    },
    assetPrefix: BASE_PATH,
    cleanDistPath: true,
    minify: shouldMinify ? { js: 'always', css: 'always' } : false,
    inlineStyles: true,
    inlineScripts: ({ size }) => size < 2 * 1_024,
    sourceMap: !shouldMinify
      ? { js: 'cheap-module-source-map', css: true }
      : false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      font: '[name][ext]',
      image: '[name].[hash:8][ext]',
    },
    copy: [
      {
        from: resolveRoot(PATHS.SRC, 'assets'),
        to: 'assets',
        globOptions: { ignore: MANAGED_EXTS.map((ext) => `**/*.${ext}`) },
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public', 'manifest.json'),
        to: 'manifest.json',
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public', 'sw.js'),
        to: 'sw.js',
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public', 'robots.txt'),
        to: 'robots.txt',
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public', 'sitemap.xml'),
        to: 'sitemap.xml',
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public', 'favicon.svg'),
        to: 'favicon.svg',
        noErrorOnMissing: true,
      },
      {
        from: resolveRoot('public/assets/i18n'),
        to: 'assets/i18n',
        noErrorOnMissing: true,
      },
    ],
  },
  plugins: [
    pluginRootPageAsIndex(),
    ...(isProd ? [pluginImageCompress({ use: 'avif', quality: 75 })] : []),
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
      optimization: {
        runtimeChunk: 'single',
      },
      module: {
        rules: [
          {
            test: /\.njk$/,
            use: [
              {
                loader: 'simple-nunjucks-loader',
                options: {
                  autoescape: false,
                  searchPaths: ['pages', 'layouts', 'shared', ''].map((d) =>
                    resolveRoot(PATHS.SRC, d),
                  ),
                  assetsPaths: [resolveRoot(PATHS.SRC, 'assets')],
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
    template: ({ entryName }) =>
      path.join(PATHS.SRC, 'pages', entryName, 'index.njk'),
    templateParameters: (params) =>
      createTemplateParams(params, LOCALE_STORAGE_KEY, getActiveLocaleCodes()),
  },
});
