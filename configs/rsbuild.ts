import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { getActiveLocaleCodes, LOCALE_STORAGE_KEY } from '@i18n';
import { getRootPageSlug, getSystemPageSlug, scanPages } from '@page-system';
import { generateDynamicEntries } from '@page-system/dynamic-routes';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { createTemplateParams } from '@template-engine';
import { resolveRoot } from '@utils/common';
import { env, schemaKeys } from '@utils/env';
import { minify } from 'html-minifier-terser';
import { html as beautifyHtml } from 'js-beautify';

const isBuild = env.IS_PROD || env.BUILD_PREVIEW;
const shouldMinify = isBuild && env.MINIFY;
const isPrettyHtml = env.PRETTY_HTML;
const shouldMinifyHTML = shouldMinify && !isPrettyHtml;
const MANAGED_EXTS = ['ts', 'css', 'njk', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

const pluginResourceHints = (): RsbuildPlugin => ({
  name: 'plugin-resource-hints',
  setup(api) {
    api.onAfterBuild(() => {
      const distDir = api.context.distPath;
      if (!fs.existsSync(distDir)) return;

      for (const file of fs.readdirSync(distDir)) {
        if (!file.endsWith('.html')) continue;
        const filePath = path.join(distDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        const jsScripts = [...content.matchAll(/<script[^>]*defer[^>]*src="([^"]*)"[^>]*><\/script>/g)];

        let hints = '';

        for (const m of jsScripts) {
          const src = m[1];
          if (!src.includes('runtime.')) {
            hints += `<link rel="modulepreload" href="${src}">\n`;
          }
        }

        const imgMatch = content.match(/<img[^>]*data-lcp="true"[^>]*src="([^"]*)"[^>]*>/);
        if (imgMatch) {
          hints += `<link rel="preload" as="image" href="${imgMatch[1]}" fetchpriority="high">\n`;
        }

        if (hints) {
          content = content.replace('</title>', `</title>\n${hints.trim()}`);
        }

        fs.writeFileSync(filePath, content);
      }
    });
  },
});

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
            compilation.contextDependencies.add(resolveRoot('locales'));
            compilation.contextDependencies.add(resolveRoot('data'));
            compilation.contextDependencies.add(resolveRoot('pages'));
            compilation.contextDependencies.add(resolveRoot('shared'));
            compilation.contextDependencies.add(resolveRoot('layouts'));
            compilation.contextDependencies.add(resolveRoot('generated'));
          });
        },
      });
    });
  },
});

const pluginPrettyHtml = (): RsbuildPlugin => ({
  name: 'plugin-pretty-html',
  setup(api) {
    if (!isPrettyHtml) return;
    api.onAfterBuild(() => {
      const distDir = api.context.distPath;
      if (!fs.existsSync(distDir)) return;

      for (const file of fs.readdirSync(distDir)) {
        if (!file.endsWith('.html')) continue;
        const filePath = path.join(distDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const beautified = beautifyHtml(content, {
          indent_size: 2,
          indent_inner_html: true,
          preserve_newlines: false,
          end_with_newline: true,
          unformatted: ['script', 'style', 'pre', 'code', 'textarea', 'span'],
        });
        fs.writeFileSync(filePath, beautified);
      }
    });
  },
});

const scannedPages = scanPages(resolveRoot('pages'), '');

const getPageNames = (): string[] => scannedPages.map((p) => p.name);

const PAGE_ENTRY = resolveRoot('shared', 'page-entry.ts');

const getEntries = (): Record<string, string | string[]> => {
  const entries: Record<string, string | string[]> = {};

  for (const page of scannedPages) {
    const scriptFile = path.join(page.dir, 'script.ts');
    entries[page.name] = fs.existsSync(scriptFile) ? scriptFile : PAGE_ENTRY;
  }

  for (const dyn of dynamicEntries) {
    const scriptFile = path.join(dyn.templateDir, 'script.ts');
    entries[dyn.entryKey] = fs.existsSync(scriptFile) ? scriptFile : PAGE_ENTRY;
  }

  return entries;
};

const dynamicEntries = generateDynamicEntries();

const dynamicTemplateMap = new Map(dynamicEntries.map((e) => [e.entryKey, e.templateDir]));

const resolveTemplate = (entryName: string): string => {
  const dynDir = dynamicTemplateMap.get(entryName);
  if (dynDir) {
    return path.relative(process.cwd(), path.join(dynDir, 'index.njk'));
  }
  return path.join('pages', entryName, 'index.njk');
};

const isSingleLocale = (i18nConfig.locales ?? []).length === 0;

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
          from: /^\/(?!locales\/|assets\/|fonts\/|images\/|favicon\.svg$|favicon\.ico$|manifest\.json$|sw\.js$|robots\.txt$|sitemap\.xml$|.*\.[a-z0-9]+$)/,
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
    minSize: 2000,
    cacheGroups: {
      default: {
        minChunks: 2,
        reuseExistingChunk: true,
      },
    },
  },
  resolve: {
    alias: {
      '@config': resolveRoot('configs'),
      '@constants': resolveRoot('constants.ts'),
      '@generated': resolveRoot('generated'),
      '@i18n': resolveRoot('packages', 'i18n'),
      '@template-engine': resolveRoot('packages', 'template-engine'),
      '@page-system': resolveRoot('packages', 'page-system'),
      '@utils': resolveRoot('utils'),
    },
  },
  source: {
    entry: getEntries(),
    define: {
      'import.meta.env.APP_ENV': JSON.stringify(
        Object.fromEntries(schemaKeys.map((k) => [k, env[k as keyof typeof env]])),
      ),
      'import.meta.env.SINGLE_LOCALE': JSON.stringify(isSingleLocale),
    },
  },
  output: {
    distPath: {
      js: 'assets/scripts',
      css: 'assets/styles',
      image: 'assets/images',
      font: 'assets/fonts',
    },
    assetPrefix: env.BASE_PATH,
    cleanDistPath: true,
    minify: shouldMinify ? { js: true, css: true } : false,
    inlineStyles: false,
    inlineScripts: false,
    sourceMap: !shouldMinify ? { js: 'cheap-module-source-map', css: true } : false,
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
        from: resolveRoot('public', 'service-worker.js'),
        to: 'service-worker.js',
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
  plugins: [pluginResourceHints(), pluginRootPageAsIndex(), pluginHotReloadContent(), pluginPrettyHtml()],
  tools: {
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
            test: /(?:^|[\\/])(?:script|page-entry)\.ts$/,
            enforce: 'pre',
            use: [
              {
                loader: resolveRoot('packages', 'page-system', 'page-inject-loader.cjs'),
                options: { bootstrap: resolveRoot('bootstrap.ts') },
              },
            ],
          },
          {
            test: /(?:bootstrap|script)\.ts$/,
            sideEffects: true,
          },
          {
            test: /\.njk$/,
            use: [
              {
                loader: 'simple-nunjucks-loader',
                options: {
                  autoescape: false,
                  searchPaths: ['pages', 'layouts', '.'].map((d) => resolveRoot(d)),
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
    template: ({ entryName }) => resolveTemplate(entryName),
    templateParameters: (params) => {
      const dynEntry = dynamicEntries.find((e) => e.entryKey === params.entryName);
      if (dynEntry) {
        return createTemplateParams(
          {
            ...params,
            entryName: path.relative(resolveRoot('pages'), dynEntry.templateDir),
          },
          LOCALE_STORAGE_KEY,
          getActiveLocaleCodes(),
          { slug: dynEntry.slug, data: dynEntry.data },
        );
      }
      return createTemplateParams(params, LOCALE_STORAGE_KEY, getActiveLocaleCodes());
    },
  },
});
