import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { minify } from 'html-minifier-terser';
import { i18nConfig } from './configs/i18n';
import { getRootPageSlug, getSystemPageSlug } from './configs/pages';
import { PATHS } from './configs/paths';
import {
  getActiveLocaleCodes,
  LOCALE_STORAGE_KEY,
} from './packages/i18n/index';
import { createTemplateParams } from './packages/i18n/template/template';

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

const getPageNames = (): string[] => {
  const dir = resolveRoot('pages');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((folder) => {
    const stat = fs.statSync(path.join(dir, folder));
    return (
      stat.isDirectory() && fs.existsSync(path.join(dir, folder, 'index.njk'))
    );
  });
};

const getEntries = (): Record<string, string | string[]> => {
  const dir = resolveRoot('pages');
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
  return [resolveRoot('bootstrap.ts'), resolveRoot('styles/main.css')].filter(
    (p) => fs.existsSync(p),
  );
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
        ...getPageNames()
          .filter((p) => p !== getRootPageSlug(i18nConfig.defaultLocale))
          .map((p) => ({
            from: new RegExp(`^/${p}$`),
            to: `/${p}.html`,
          })),
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
      paths: [
        'pages/**/*.njk',
        'layouts/**/*.njk',
        'shared/**/*.njk',
        'locales/**/*.json',
        'pages/**/*.json5',
      ],
      type: 'reload-page',
    },
  },
  splitChunks: {
    preset: 'default',
  },
  resolve: {
    alias: {
      '@generated': resolveRoot(PATHS.GENERATED),
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
        from: resolveRoot('assets'),
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
                  searchPaths: ['pages', 'layouts', '.'].map((d) =>
                    resolveRoot(d),
                  ),
                  assetsPaths: [resolveRoot('assets')],
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
    template: ({ entryName }) => path.join('pages', entryName, 'index.njk'),
    templateParameters: (params) =>
      createTemplateParams(params, LOCALE_STORAGE_KEY, getActiveLocaleCodes()),
  },
});
