import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { minify } from 'html-minifier-terser';
import {
  LOCALE_CODES,
  LOCALE_STORAGE_KEY,
} from './src/configs/locales';
import { PATHS } from './src/configs/paths';
import { createTemplateParams } from './src/scripts/lib/template';

const ROOT = process.cwd();
const PORT = 8888;
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

const getEntries = (): Record<string, string | string[]> => {
  const dir = resolveRoot(PATHS.SRC, 'pages');
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
  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      minSize: 20000,
      maxSize: 50000,
      override: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 50000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          styles: {
            name: 'styles',
            test: /\.(?:css|less|sass|scss|styl)$/,
            priority: 30,
            reuseExistingChunk: true,
          },
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolveRoot(PATHS.SRC),
      '@components': resolveRoot(PATHS.SRC, 'components'),
      '@assets': resolveRoot(PATHS.SRC, 'assets'),
      '@generated': resolveRoot(PATHS.GENERATED),
      '@configs': resolveRoot(PATHS.SRC, 'configs'),
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
    ],
  },
  plugins: [pluginImageCompress({ use: 'avif', quality: 75 })],
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
                  autoescape: false,
                  searchPaths: ['pages', 'layouts', 'components', ''].map((d) =>
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
      createTemplateParams(params, LOCALE_STORAGE_KEY, LOCALE_CODES),
  },
});
