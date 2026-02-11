import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import {
  type Compilation,
  type Compiler,
  CopyRspackPlugin,
} from '@rspack/core';
import tailwindcss from '@tailwindcss/postcss';
import { minify } from 'html-minifier-terser';

const isProd = process.env.NODE_ENV === 'production';
const shouldMinify = isProd && process.env.MINIFY !== 'false';
const shouldMinifyHTML = shouldMinify && process.env.MINIFY_HTML !== 'false';
const ROOT = process.cwd();
const resolveRoot = (...args: string[]) => path.resolve(ROOT, ...args);

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

const readJSON = (filePath: string): Record<string, unknown> => {
  try {
    return fs.existsSync(filePath)
      ? (JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<
          string,
          unknown
        >)
      : {};
  } catch {
    return {};
  }
};

const loadGlobalData = () => {
  const dir = resolveRoot('src/data');
  const globalData: Record<string, unknown> = {};
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

const getEntries = () => {
  const dir = resolveRoot('src/pages');
  const entries: Record<string, any> = {};
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

const getGlobalEntries = () => {
  const globalEntries: string[] = [];
  const scriptPath = resolveRoot('src/scripts/main.ts');
  const stylePath = resolveRoot('src/styles/main.css');

  if (fs.existsSync(scriptPath)) globalEntries.push(scriptPath);
  if (fs.existsSync(stylePath)) globalEntries.push(stylePath);
  return globalEntries;
};

const WatchJsonPlugin = {
  apply(compiler: Compiler) {
    compiler.hooks.afterCompile.tap(
      'WatchJsonPlugin',
      (compilation: Compilation) => {
        const watchDirs = ['data', 'pages'];
        for (const d of watchDirs) {
          const full = resolveRoot('src', d);
          if (fs.existsSync(full)) {
            const files = fs.readdirSync(full, { recursive: true }) as string[];
            for (const f of files) {
              if (f.endsWith('.json')) {
                compilation.fileDependencies.add(path.join(full, f));
              }
            }
          }
        }
      },
    );
  },
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
        'src/**/*.css',
      ],
      options: { usePolling: true, interval: 100, binaryInterval: 300 },
      type: 'reload-page',
    },
  },

  resolve: {
    alias: (() => {
      const aliases: Record<string, string> = { '@': resolveRoot('src') };
      const dirs = ['data', 'pages', 'assets', 'layouts'];
      for (const dir of dirs) {
        aliases[`@${dir}`] = resolveRoot('src', dir);
      }
      return aliases;
    })(),
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
    },
    assetPrefix: './',
    cleanDistPath: true,
    minify: shouldMinify,
    sourceMap: !shouldMinify
      ? { js: 'cheap-module-source-map', css: true }
      : false,
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      image: '[name].[hash:8][ext]',
    },
  },

  html: {
    template: ({ entryName }) => path.join('src/pages', entryName, 'index.njk'),
    templateParameters: (params) => {
      const name = String(params.entryName || '');
      return {
        ...params,
        ...loadGlobalData(),
        ...readJSON(resolveRoot('src/pages', name, 'index.json')),
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
                  searchPaths: ['pages', 'layouts', ''].map((d) =>
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
});
