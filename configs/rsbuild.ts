import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { browserEnv, env } from '@generated/env';
import { alias, lookup } from '@generated/paths';
import { getActiveLocaleCodes, isSingleLocale, LOCALE_STORAGE_KEY } from '@i18n';
import { getRootPageSlug, getSystemPageSlug, scanPages } from '@page-system';
import { generateDynamicEntries } from '@page-system/dynamic-routes';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { createTemplateParams } from '@template-engine';
import { readJSON5 } from '@utils/json5';
import { minify } from 'html-minifier-terser';
import { html as beautifyHtml } from 'js-beautify';
import lightningcss from 'lightningcss';

const isBuild = env.IS_PROD || env.BUILD_PREVIEW;
const shouldMinify = isBuild && env.MINIFY;
const isPrettyHtml = env.PRETTY_HTML;
const shouldMinifyHTML = shouldMinify && !isPrettyHtml;
const MANAGED_EXTS = ['ts', 'css', 'njk', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'];

const pluginPreloadChunks = (): RsbuildPlugin => ({
  name: 'plugin-preload-chunks',
  setup(api) {
    api.onAfterBuild(() => {
      if (!isBuild) return;

      const distDir = api.context.distPath;
      if (!fs.existsSync(distDir)) return;

      const chunkUrls: string[] = [];
      for (const sub of ['', 'async']) {
        const dir = path.join(distDir, 'assets', 'scripts', sub);
        if (!fs.existsSync(dir)) continue;
        const prefix = sub ? '/assets/scripts/async' : '/assets/scripts';
        for (const f of fs.readdirSync(dir)) {
          if (f.endsWith('.js') && Object.values(CHUNK_NAMES).some((n) => f.startsWith(n))) {
            chunkUrls.push(`${prefix}/${f}`);
          }
        }
      }

      if (!chunkUrls.length) return;

      for (const file of fs.readdirSync(distDir)) {
        if (!file.endsWith('.html')) continue;
        const filePath = path.join(distDir, file);
        let html = fs.readFileSync(filePath, 'utf-8');
        const deferSrcs = new Set([...html.matchAll(/<script\s+defer\s+[^>]*src="([^"]*)"/g)].map((m) => m[1]));
        const preloads = chunkUrls
          .filter((url) => !deferSrcs.has(url))
          .map((url) => `<link rel="preload" as="script" href="${url}">`)
          .join('\n');
        if (preloads) {
          html = html.replace('</title>', `</title>\n${preloads}`);
          fs.writeFileSync(filePath, html);
        }
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
            compilation.contextDependencies.add(lookup('@locales'));
            compilation.contextDependencies.add(lookup('@data'));
            compilation.contextDependencies.add(lookup('@pages'));
            compilation.contextDependencies.add(lookup('@shared'));
            compilation.contextDependencies.add(lookup('@layouts'));
            compilation.contextDependencies.add(lookup('@generated'));
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

const pluginInlineCss = (): RsbuildPlugin => ({
  name: 'plugin-inline-css',
  setup(api) {
    api.onAfterBuild(() => {
      if (!isBuild) return;

      const distDir = api.context.distPath;
      if (!fs.existsSync(distDir)) return;

      let inlined = 0;

      for (const file of fs.readdirSync(distDir)) {
        if (!file.endsWith('.html')) continue;
        const filePath = path.join(distDir, file);
        let html = fs.readFileSync(filePath, 'utf-8');

        const nonceMatch = html.match(/nonce-([a-zA-Z0-9_-]+)/);
        if (!nonceMatch) continue;
        const nonce = nonceMatch[1];

        const linkMatches = [...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*>/g)];
        let modified = false;

        for (const m of linkMatches) {
          const tag = m[0];
          const hrefMatch = tag.match(/href="([^"]+)"/);
          if (!hrefMatch) continue;

          const href = hrefMatch[1];
          if (href.startsWith('http')) continue;

          const cssPath = path.join(distDir, href.replace(/^\//, ''));
          if (!fs.existsSync(cssPath)) continue;

          let css = fs.readFileSync(cssPath, 'utf-8');
          const cssDir = href.substring(0, href.lastIndexOf('/'));
          css = css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, (match, url: string) => {
            if (url.startsWith('/') || url.startsWith('http') || url.startsWith('data:')) return match;
            return `url(${cssDir}/${url.replace(/^\.\//, '')})`;
          });
          const minified = lightningcss.transform({
            code: Buffer.from(css),
            filename: path.basename(cssPath),
            minify: true,
          });
          css = minified.code.toString();
          html = html.replace(tag, `<style nonce="${nonce}">${css}</style>`);
          modified = true;
          inlined++;
        }

        if (modified) {
          fs.writeFileSync(filePath, html);
        }
      }

      if (inlined > 0) {
        console.log(`  [plugin-inline-css] Inlined ${inlined} stylesheet(s) into HTML`);
      }
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

const PAGE_ENTRY = lookup('@shared', 'page-entry.ts');

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
    minSize: 2000,
    cacheGroups: {
      i18next: {
        test: /[\\/]node_modules[\\/](i18next|@formatjs|intl-pluralrules|intl-messageformat)[\\/]/,
        name: CHUNK_NAMES.i18next,
        chunks: 'all',
        priority: 30,
      },
      alpinePlugins: {
        test: /[\\/]node_modules[\\/]@alpinejs[\\/](collapse|focus)[\\/]/,
        name: 'chunk-alpine-plugins',
        chunks: 'async',
        priority: 25,
      },
      alpineCore: {
        test: /[\\/]node_modules[\\/]@alpinejs[\\/]csp[\\/]/,
        name: CHUNK_NAMES.alpineCore,
        chunks: 'all',
        priority: 20,
      },
      i18nFormatters: {
        test: /[\\/]packages[\\/]i18n[\\/](data|engine|runtime|strategies|fonts)[\\/]/,
        name: CHUNK_NAMES.i18nFormatters,
        chunks: 'async',
        priority: 15,
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
      js: 'assets/scripts',
      css: 'assets/styles',
      image: 'assets/images',
      font: 'assets/fonts',
    },
    assetPrefix: env.BASE_PATH,
    cleanDistPath: true,
    minify: shouldMinify ? { js: true, css: true } : false,
    inlineStyles: false,
    sourceMap: !shouldMinify ? { js: 'cheap-module-source-map', css: true } : false,
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
        from: lookup('@public', 'manifest.json'),
        to: 'manifest.json',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', 'service-worker.js'),
        to: 'service-worker.js',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', 'robots.txt'),
        to: 'robots.txt',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', 'sitemap.xml'),
        to: 'sitemap.xml',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', 'favicon.svg'),
        to: 'favicon.svg',
        noErrorOnMissing: true,
      },
      {
        from: lookup('@public', 'assets/images'),
        to: 'assets/images',
        noErrorOnMissing: true,
      },
    ],
  },
  plugins: [
    pluginPreloadChunks(),
    pluginRootPageAsIndex(),
    pluginHotReloadContent(),
    pluginPrettyHtml(),
    pluginRemoveEmptyPageJs(),
    pluginInlineCss(),
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
                loader: lookup('@page-system', 'page-inject-loader.cjs'),
                options: { bootstrap: lookup('@scripts', 'bootstrap.ts') },
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
                  searchPaths: [lookup('@pages'), lookup('@layouts'), lookup('@')],
                  assetsPaths: [lookup('@assets')],
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
            entryName: path.relative(lookup('@pages'), dynEntry.templateDir),
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
