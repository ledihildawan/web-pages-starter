import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { browserEnv, env } from '@generated/env';
import { getActiveLocaleCodes, isSingleLocale, LOCALE_STORAGE_KEY } from '@i18n';
import { getRootPageSlug, getSystemPageSlug, scanPages } from '@page-system';
import { generateDynamicEntries } from '@page-system/dynamic-routes';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { createTemplateParams } from '@template-engine';
import { alias } from '@utils/alias';
import { lookup } from '@utils/paths';
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
            compilation.contextDependencies.add(lookup('@', 'locales'));
            compilation.contextDependencies.add(lookup('@', 'data'));
            compilation.contextDependencies.add(lookup('@', 'pages'));
            compilation.contextDependencies.add(lookup('@', 'shared'));
            compilation.contextDependencies.add(lookup('@', 'layouts'));
            compilation.contextDependencies.add(lookup('@', 'generated'));
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

const pluginRemoveEmptyPageJs = (): RsbuildPlugin => ({
  name: 'plugin-remove-empty-page-js',
  setup(api) {
    api.onAfterBuild(() => {
      const distDir = api.context.distPath;
      if (!fs.existsSync(distDir)) return;

      const EMPTY_PATTERN = /rspackChunk.*?push\(\[\[\d+\],\{\d+:function\([a-z],[a-z],[a-z]\)\{[a-z]\(\d+\)\}\}/;
      let removed = 0;

      for (const file of fs.readdirSync(distDir)) {
        if (!file.endsWith('.html')) continue;
        const htmlPath = path.join(distDir, file);
        let html = fs.readFileSync(htmlPath, 'utf-8');
        let modified = false;

        const scripts = [...html.matchAll(/<script\s+defer\s+src="([^"]+\.js)"><\/script>/g)];

        for (const m of scripts) {
          const src = m[1];
          const jsFile = src.replace(/^\//, '');
          const jsPath = path.join(distDir, jsFile);

          if (!fs.existsSync(jsPath)) continue;
          const content = fs.readFileSync(jsPath, 'utf-8');

          if (!EMPTY_PATTERN.test(content)) continue;

          html = html.split(m[0]).join('');
          html = html.replace(
            new RegExp(`<link[^>]*modulepreload[^>]*href="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g'),
            '',
          );
          fs.unlinkSync(jsPath);
          removed++;
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(htmlPath, html);
        }
      }

      if (removed > 0) {
        console.log(`  [plugin-remove-empty-page-js] Removed ${removed} empty JS file(s) + script tags`);
      }
    });
  },
});

const scannedPages = scanPages(lookup('@', 'pages'), '');

const getPageNames = (): string[] => scannedPages.map((p) => p.name);

const PAGE_ENTRY = lookup('@', 'shared', 'page-entry.ts');

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
    alias,
  },
  source: {
    entry: getEntries(),
    define: {
      'import.meta.env': JSON.stringify({
        ...browserEnv,
        SINGLE_LOCALE: isSingleLocale(),
      }),
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
        from: lookup('@', 'assets'),
        to: 'assets',
        globOptions: { ignore: MANAGED_EXTS.map((ext) => `**/*.${ext}`) },
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public', 'manifest.json'),
        to: 'manifest.json',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public', 'service-worker.js'),
        to: 'service-worker.js',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public', 'robots.txt'),
        to: 'robots.txt',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public', 'sitemap.xml'),
        to: 'sitemap.xml',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public', 'favicon.svg'),
        to: 'favicon.svg',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@', 'public/assets/i18n'),
        to: 'assets/i18n',
        noErrorOnMissing: true,
      },
    ],
  },
  plugins: [
    pluginResourceHints(),
    pluginRootPageAsIndex(),
    pluginHotReloadContent(),
    pluginPrettyHtml(),
    pluginRemoveEmptyPageJs(),
  ],
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
                loader: lookup('@', 'packages', 'page-system', 'page-inject-loader.cjs'),
                options: { bootstrap: lookup('@', 'bootstrap.ts') },
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
                  searchPaths: ['pages', 'layouts', '.'].map((d) => lookup('@', d)),
                  assetsPaths: [lookup('@', 'assets')],
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
            entryName: path.relative(lookup('@', 'pages'), dynEntry.templateDir),
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
