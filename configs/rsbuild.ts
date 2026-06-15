import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { IS_PROD } from '@constants/env';
import { PATHS } from '@constants/paths';
import { getActiveLocaleCodes, LOCALE_STORAGE_KEY } from '@i18n';
import { getRootPageSlug, getSystemPageSlug, scanPages } from '@page-engine';
import { createTemplateParams } from '@page-engine/template';
import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { generateDynamicEntries } from '@scripts/generate-dynamic-routes';
import { minify } from 'html-minifier-terser';
import { html as beautifyHtml } from 'js-beautify';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8888;
const BASE_PATH = process.env.BASE_PATH || '/';
const isBuild = IS_PROD || process.env.BUILD_PREVIEW === 'true';
const shouldMinify = isBuild && process.env.MINIFY !== 'false';
const isPrettyHtml = process.env.PRETTY_HTML === 'true';
const shouldMinifyHTML = shouldMinify && !isPrettyHtml;
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

const pluginHotReloadContent = (): RsbuildPlugin => ({
  name: 'plugin-hot-reload-content',
  setup(api) {
    api.modifyBundlerChain((chain, { isServer, isWebWorker }) => {
      if (isServer || isWebWorker) return;

      chain.plugin('watch-content-files').use({
        apply(compiler: {
          hooks: {
            afterCompile: {
              tap: (
                name: string,
                fn: (c: { contextDependencies: Set<string> }) => void,
              ) => void;
            };
          };
        }) {
          compiler.hooks.afterCompile.tap(
            'watch-content-files',
            (compilation) => {
              compilation.contextDependencies.add(
                path.resolve(ROOT, 'locales'),
              );
              compilation.contextDependencies.add(path.resolve(ROOT, 'data'));
              compilation.contextDependencies.add(path.resolve(ROOT, 'pages'));
              compilation.contextDependencies.add(path.resolve(ROOT, 'shared'));
              compilation.contextDependencies.add(
                path.resolve(ROOT, 'layouts'),
              );
            },
          );
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

const getEntries = (): Record<string, string | string[]> => {
  const entries: Record<string, string | string[]> = {};

  for (const page of scannedPages) {
    const tsFile = path.join(page.dir, 'index.ts');
    const cssFile = path.join(page.dir, 'index.css');
    if (fs.existsSync(tsFile)) {
      entries[page.name] = fs.existsSync(cssFile) ? [tsFile, cssFile] : tsFile;
    }
  }

  for (const dyn of dynamicEntries) {
    const tsFile = path.join(dyn.templateDir, 'index.ts');
    const cssFile = path.join(dyn.templateDir, 'index.css');
    if (fs.existsSync(tsFile)) {
      entries[dyn.entryKey] = fs.existsSync(cssFile)
        ? [tsFile, cssFile]
        : tsFile;
    }
  }

  return entries;
};

const getGlobalEntries = (): string[] => {
  return [resolveRoot('bootstrap.ts'), resolveRoot('styles/main.css')].filter(
    (p) => fs.existsSync(p),
  );
};

const dynamicEntries = generateDynamicEntries();

const dynamicTemplateMap = new Map(
  dynamicEntries.map((e) => [e.entryKey, e.templateDir]),
);

const resolveTemplate = (entryName: string): string => {
  const dynDir = dynamicTemplateMap.get(entryName);
  if (dynDir) {
    return path.relative(ROOT, path.join(dynDir, 'index.njk'));
  }
  return path.join('pages', entryName, 'index.njk');
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
    preset: 'default',
  },
  resolve: {
    alias: {
      '@config': resolveRoot('configs'),
      '@constants': resolveRoot('constants'),
      '@generated': resolveRoot(PATHS.GENERATED),
      '@i18n': resolveRoot('packages', 'i18n'),
      '@page-engine': resolveRoot('packages', 'page-engine'),
      '@utils': resolveRoot('utils'),
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
    pluginHotReloadContent(),
    pluginPrettyHtml(),
    ...(isBuild ? [pluginImageCompress({ use: 'avif', quality: 75 })] : []),
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
              ignoreCustomFragments: [
                /\{\{[\s\S]*?\}\}/,
                /\{%[\s\S]*?%\}/,
                /\{#[\s\S]*?#\}/,
              ],
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
    template: ({ entryName }) => resolveTemplate(entryName),
    templateParameters: (params) => {
      const dynEntry = dynamicEntries.find(
        (e) => e.entryKey === params.entryName,
      );
      if (dynEntry) {
        return createTemplateParams(
          {
            ...params,
            entryName: path.relative(
              resolveRoot('pages'),
              dynEntry.templateDir,
            ),
          },
          LOCALE_STORAGE_KEY,
          getActiveLocaleCodes(),
          { slug: dynEntry.slug, data: dynEntry.data },
        );
      }
      return createTemplateParams(
        params,
        LOCALE_STORAGE_KEY,
        getActiveLocaleCodes(),
      );
    },
  },
});
