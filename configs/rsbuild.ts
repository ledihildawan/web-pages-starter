import fs from 'node:fs';
import { join, relative } from 'pathe';
import { i18nConfig } from '@config/i18n';
import { ASSET_PATHS } from '@web-pages-starter/core/asset-paths';
import { PUBLIC_FILENAMES } from '@web-pages-starter/core/public-filenames';
import { browserEnv, env } from '@generated/env';
import { alias, lookup } from '@generated/paths';
import { getActiveLocaleCodes, isSingleLocale, LOCALE_STORAGE_KEY } from '@web-pages-starter/i18n';
import { CSP_NONCE_PLACEHOLDER } from '@web-pages-starter/i18n/constants';
import { getRootPageSlug, getSystemPageSlug, scanPages } from '@web-pages-starter/page-system';
import { generateDynamicEntries } from '@web-pages-starter/page-system/dynamic-routes';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { createTemplateParams } from '@web-pages-starter/template-engine';
import { readJSON5 } from '@web-pages-starter/core/json5';
import { minify } from 'html-minifier-terser';

const isBuild = env.IS_PROD || env.BUILD_PREVIEW;
const shouldMinify = isBuild && env.MINIFY;
const isPrettyHtml = env.PRETTY_HTML;
const shouldMinifyHTML = shouldMinify && !isPrettyHtml;
const MANAGED_EXTS = ['ts', 'css', 'njk', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

const pluginHotReloadContent = (): RsbuildPlugin => ({
  name: 'plugin-hot-reload-content',
  setup(api) {
    api.modifyBundlerChain((chain, { isServer, isWebWorker }) => {
      if (isServer || isWebWorker) return;

      chain.plugin('watch-content-files').use({
        apply(compiler: {
          hooks: {
            afterCompile: {
              tap: (name: string, fn: (c: { contextDependencies: Set<string> }) => void) => void;
            };
          };
        }) {
          compiler.hooks.afterCompile.tap('watch-content-files', (compilation) => {
            compilation.contextDependencies.add(lookup('@locales'));
            compilation.contextDependencies.add(lookup('@data'));
            compilation.contextDependencies.add(lookup('@pages'));
            compilation.contextDependencies.add(lookup('@shared'));
            compilation.contextDependencies.add(lookup('@layouts'));
            compilation.contextDependencies.add(lookup('@generated'));
            compilation.contextDependencies.add(lookup('@features'));
          });
        },
      });
    });
  },
});

const CHUNK_NAMES = {
  alpineCore: 'chunk-alpine-core',
  alpinePlugins: 'chunk-alpine-plugins',
  i18next: 'chunk-i18next',
  i18nFormatters: 'chunk-i18n-formatters',
} as const;

const globalConfig = readJSON5(lookup('@data', 'global.json5')) as { flag_cdn?: string };
const FLAG_CDN_BASE = globalConfig.flag_cdn || 'https://flagcdn.com';

const scannedPages = scanPages(lookup('@pages'), '');

const getPageNames = (): string[] => scannedPages.map((p) => p.name);

const getEntries = (): Record<string, string | string[]> => {
  const entries: Record<string, string | string[]> = {};

  for (const page of scannedPages) {
    const scriptFile = join(page.dir, 'script.ts');
    if (fs.existsSync(scriptFile)) {
      entries[page.name] = scriptFile;
    }
  }

  for (const dyn of dynamicEntries) {
    const scriptFile = join(dyn.templateDir, 'script.ts');
    if (fs.existsSync(scriptFile)) {
      entries[dyn.entryKey] = scriptFile;
    }
  }

  return entries;
};

const dynamicEntries = generateDynamicEntries();

const dynamicTemplateMap = new Map(dynamicEntries.map((e) => [e.entryKey, e.templateDir]));

const resolveTemplate = (entryName: string): string => {
  const dynDir = dynamicTemplateMap.get(entryName);
  if (dynDir) {
    return relative(process.cwd(), join(dynDir, 'index.njk'));
  }
  return join('pages', entryName, 'index.njk');
};

export default defineConfig({
  server: {
    host: env.HOST,
    port: env.PORT,
    strictPort: true,
    historyApiFallback: {
      rewrites: [
        {
          from: /^\/$/,
          to: `/${getRootPageSlug(i18nConfig.defaultLocale)}.html`,
        },
        ...getPageNames()
          .filter((p) => p !== getRootPageSlug(i18nConfig.defaultLocale))
          .map((p) => {
            const escaped = p.replace(/\//g, '\\/');
            return {
              from: new RegExp(`^/${escaped}$`),
              to: `/${p}.html`,
            };
          }),
        {
          from: /^\/(?!locales\/|assets\/|fonts\/|images\/|favicon\.svg$|favicon\.ico$|manifest\.json$|service-worker\.js$|robots\.txt$|sitemap\.xml$|.*\.[a-z0-9]+$)/,
          to: `/${getSystemPageSlug('not-found', i18nConfig.defaultLocale)}.html`,
        },
      ],
      disableDotRule: true,
    },
  },
  dev: {
    writeToDisk: false,
  },
  splitChunks: {
    minSize: 20000,
    cacheGroups: {
      bootstrap: {
        test: /[\\/]scripts[\\/]bootstrap\.ts$/,
        name: 'bootstrap',
        chunks: 'all',
        priority: 40,
        enforce: true,
      },
      i18next: {
        test: /[\\/]node_modules[\\/](i18next|@formatjs|intl-pluralrules|intl-messageformat)[\\/]/,
        name: CHUNK_NAMES.i18next,
        chunks: 'all',
        priority: 30,
        enforce: true,
      },
      alpinePlugins: {
        test: /[\\/]node_modules[\\/]@alpinejs[\\/](collapse|focus)[\\/]/,
        name: CHUNK_NAMES.alpinePlugins,
        chunks: 'async',
        priority: 25,
      },
      alpineCore: {
        test: /[\\/]node_modules[\\/]@alpinejs[\\/]csp[\\/]/,
        name: CHUNK_NAMES.alpineCore,
        chunks: 'all',
        priority: 20,
        enforce: true,
      },
      i18nFormatters: {
        test: /[\\/]packages[\\/]i18n[\\/](data|engine|runtime|strategies|fonts)[\\/]/,
        name: CHUNK_NAMES.i18nFormatters,
        chunks: 'async',
        priority: 15,
      },
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
      default: {
        minChunks: 2,
        reuseExistingChunk: true,
        priority: -10,
      },
    },
  },
  resolve: {
    alias,
  },
  source: {
    entry: getEntries(),
    define: {
      'import.meta.env': JSON.stringify({
        ...browserEnv,
        BROWSER: true,
        SINGLE_LOCALE: isSingleLocale(),
        DEFAULT_LOCALE: i18nConfig.defaultLocale,
        FLAG_CDN_BASE,
      }),
    },
  },
  output: {
    distPath: {
      root: 'rsbuild-out',
      js: ASSET_PATHS.scripts,
      css: ASSET_PATHS.styles,
      image: ASSET_PATHS.images,
      font: ASSET_PATHS.fonts,
    },
    assetPrefix: env.BASE_PATH,
    cleanDistPath: true,
    minify: isPrettyHtml ? { css: true, js: false } : shouldMinify ? { js: true, css: true } : false,
    sourceMap: !shouldMinify ? { js: 'cheap-module-source-map', css: true } : false,
    inlineStyles: false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      font: '[name][ext]',
      image: '[name].[hash:8][ext]',
    },
    copy: [
      {
        from: lookup('@assets'),
        to: 'assets',
        globOptions: { ignore: MANAGED_EXTS.map((ext) => `**/*.${ext}`) },
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', PUBLIC_FILENAMES.manifest),
        to: PUBLIC_FILENAMES.manifest,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', PUBLIC_FILENAMES.serviceWorker),
        to: PUBLIC_FILENAMES.serviceWorker,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', PUBLIC_FILENAMES.robots),
        to: PUBLIC_FILENAMES.robots,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', PUBLIC_FILENAMES.sitemap),
        to: PUBLIC_FILENAMES.sitemap,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', PUBLIC_FILENAMES.faviconSvg),
        to: PUBLIC_FILENAMES.faviconSvg,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', ASSET_PATHS.images),
        to: ASSET_PATHS.images,
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', ASSET_PATHS.locales),
        to: ASSET_PATHS.locales,
        noErrorOnMissing: true,
      },
    ],
  },
  plugins: [pluginHotReloadContent()],
  tools: {
    lightningcssLoader: isPrettyHtml
      ? {
          targets: 'Chrome >= 111, Safari >= 15.4, Firefox >= 113, Edge >= 111',
          exclude: {
            colorFunction: true,
            oklabColors: true,
            labColors: true,
            p3Colors: true,
          },
        }
      : undefined,
    htmlPlugin: (config) => {
      config.minify = (html: string) =>
        !shouldMinifyHTML
          ? html
          : minify(html, {
              collapseWhitespace: true,
              conservativeCollapse: true,
              collapseBooleanAttributes: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
              decodeEntities: true,
              minifyCSS: true,
              minifyJS: true,
              processScripts: ['application/ld+json'],
              sortAttributes: true,
              sortClassName: true,
              continueOnParseError: true,
              customEventAttributes: [/^on[a-z]{3,}$/],
              removeAttributeQuotes: false,
              keepClosingSlash: true,
              ignoreCustomFragments: [/\{\{[\s\S]*?\}\}/, /\{%[\s\S]*?%\}/, /\{#[\s\S]*?#\}/],
              collapseInlineTagWhitespace: false,
              removeEmptyAttributes: false,
              removeEmptyElements: false,
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
            test: /(?:^|[\\/])script\.ts$/,
            enforce: 'pre',
            use: [
              {
                loader: lookup('@page-system', 'page-inject-loader.cjs'),
                options: {
                  mainCss: lookup('@', 'styles/main.css'),
                  bootstrap: lookup('@', 'scripts/bootstrap.ts'),
                },
              },
            ],
          },
          { test: /(?:bootstrap|script)\.ts$/, sideEffects: true },
          { test: /\.njk$/, use: [{ loader: 'simple-nunjucks-loader', options: { autoescape: false } }] },
        ],
      },
    },
  },
  performance: {
    buildCache: {
      cacheDirectory: lookup('@', 'node_modules/.cache/rsbuild'),
    },
  },
  html: {
    inject: 'head',
    scriptLoading: 'defer',
    template: ({ entryName }) => resolveTemplate(entryName),
    templateParameters: (params) => {
      const dynEntry = dynamicEntries.find((e) => e.entryKey === params.entryName);
      if (dynEntry) {
        return createTemplateParams(
          {
            ...params,
            entryName: relative(lookup('@pages'), dynEntry.templateDir),
          },
          LOCALE_STORAGE_KEY,
          getActiveLocaleCodes(),
          { slug: dynEntry.slug, data: dynEntry.data },
        );
      }
      return createTemplateParams(params, LOCALE_STORAGE_KEY, getActiveLocaleCodes());
    },
  },
  security: {
    nonce: CSP_NONCE_PLACEHOLDER,
  },
});
