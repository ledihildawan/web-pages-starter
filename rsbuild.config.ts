import { defineConfig, type PostCSSOptions } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { CopyRspackPlugin, type Compiler, type Compilation } from '@rspack/core';
import { minify } from 'html-minifier-terser';
import path from 'path';
import fs from 'node:fs';
import tailwindcss from '@tailwindcss/postcss';

// --- LOGIC SWITCH MINIFY ---
// 1. Mode Production
// 2. Variable MINIFY tidak di-set ke 'false'
const isProd = process.env.NODE_ENV === 'production';
const shouldMinify = isProd && process.env.MINIFY !== 'false';

// --- HELPER 1: AUTO-DISCOVERY GLOBAL DATA ---
const loadGlobalData = () => {
  const dataDir = path.resolve(__dirname, 'src/data');
  const globalData: Record<string, any> = {};

  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    files.forEach((file) => {
      if (path.extname(file) === '.json') {
        const fileName = path.basename(file, '.json');
        const filePath = path.join(dataDir, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (fileName === 'global') {
            Object.assign(globalData, content);
          } else {
            globalData[fileName] = content;
          }
        } catch (e) { console.error(e); }
      }
    });
  }
  return globalData;
};

// --- HELPER 2: AUTO-DISCOVERY PAGE ENTRIES ---
const getEntries = () => {
  const pagesDir = path.resolve(__dirname, 'src/pages');
  const entries: Record<string, string> = {};

  if (fs.existsSync(pagesDir)) {
    const folders = fs.readdirSync(pagesDir);
    folders.forEach((folder) => {
      const entryFile = path.join(pagesDir, folder, `${folder}.ts`);
      if (fs.existsSync(entryFile)) {
        entries[folder] = entryFile;
      }
    });
  }
  return entries;
};

export default defineConfig({
  // 1. PERFORMANCE: Code Splitting & Console Removal
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
    // Hapus console.log hanya jika minify aktif
    removeConsole: shouldMinify,
  },

  plugins: [
    pluginImageCompress(
      { use: 'jpeg', quality: 60 },
      { use: 'png' },
      { use: 'webp', quality: 60 }
    ),
  ],

  server: {
    port: 3000,
    open: true,
    strictPort: true,
    historyApiFallback: {
      index: '/404.html', 
      disableDotRule: true
    }
  },

  dev: {
    watchFiles: {
      paths: [
        'src/**/*.njk',
        'src/data/**/*.json',
        'src/pages/**/*.json',
        'src/**/*.css', // Safety net untuk CSS reload di Windows
      ],
      options: {
        usePolling: true,
        interval: 100,
      },
      type: 'reload-page',
    },
  },

  // 2. ALIAS PATH
  resolve: {
    alias: { 
      '@': path.resolve(__dirname, 'src'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@partials': path.resolve(__dirname, 'src/partials'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
    },
  },

  source: {
    preEntry: ['./src/assets/scripts/global.ts'],
    entry: getEntries(),
  },

  output: {
    distPath: { js: 'scripts', css: 'styles', image: 'assets/images' },
    assetPrefix: './',
    cleanDistPath: true,
    target: 'web',
    
    // Aktifkan Source Map JIKA TIDAK di-minify (untuk debugging)
    sourceMap: !shouldMinify 
      ? { js: 'cheap-module-source-map', css: true } 
      : { js: false, css: false },
    
    // 🔥 KONTROL MINIFY JS/CSS
    minify: shouldMinify,

    filenameHash: true, 
    filename: {
      js: '[name].[contenthash:8].js',
      css: '[name].[contenthash:8].css',
      image: '[name].[hash:8][ext]', // Fix hash conflict dengan image compress
    }
  },

  html: {
    template: ({ entryName }) => `./src/pages/${entryName}/${entryName}.njk`,
    templateParameters: (params) => {
      const entryName = params.entryName;
      const globalData = loadGlobalData();
      const pageDataPath = path.resolve(__dirname, `src/pages/${entryName}/${entryName}.json`);
      let pageData = {};
      
      if (fs.existsSync(pageDataPath)) {
        try {
          pageData = JSON.parse(fs.readFileSync(pageDataPath, 'utf-8'));
        } catch (e) { console.error(e); }
      }
      return { ...params, ...globalData, ...pageData };
    },
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      charset: { charset: 'UTF-8' },
    },
    title: 'My App',
  },

  tools: {
    htmlPlugin: (config) => {
      config.minify = (html: string) => {
        if (!shouldMinify) {
          return html; // Kembalikan apa adanya jika MINIFY=false
        }

        return minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
          minifyURLs: true,
        });
      };
      return config;
    },

    postcss: (config) => {
      config.postcssOptions ??= {};
      const opts = config.postcssOptions as PostCSSOptions;
      opts.plugins ??= [];
      opts.plugins.push(tailwindcss());
    },

    rspack: {
      plugins: [
        new CopyRspackPlugin({
          patterns: [{
            from: path.resolve(__dirname, 'src/assets'),
            to: 'assets',
            globOptions: { 
              // Ignore gambar agar diproses oleh Nunjucks Loader (Hash+Compress)
              ignore: [
                '**/*.ts', '**/*.css', '**/*.njk', 
                '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.svg', '**/*.gif'
              ] 
            },
            noErrorOnMissing: true, 
          }],
        }),
        
        // Plugin Watcher JSON Custom
        {
          apply(compiler: Compiler) {
            compiler.hooks.afterCompile.tap('WatchDataPlugin', (compilation: Compilation) => {
              const addDirToWatch = (dir: string) => {
                if (fs.existsSync(dir)) {
                   const files = fs.readdirSync(dir, { recursive: true }) as string[];
                   files.forEach(f => {
                     if (f.endsWith('.json')) compilation.fileDependencies.add(path.join(dir, f));
                   });
                }
              };
              addDirToWatch(path.resolve(__dirname, 'src/data'));
              addDirToWatch(path.resolve(__dirname, 'src/pages'));
            });
          }
        }
      ],
      module: {
        rules: [
          {
            test: /\.njk$/,
            use: [{
              loader: 'simple-nunjucks-loader',
              options: {
                searchPaths: [
                  // Path absolut ke folder utama
        path.join(__dirname, 'src/pages'),
        path.join(__dirname, 'src/layouts'),
        path.join(__dirname, 'src/partials'),
        // Tambahkan root 'src' agar bisa panggil path dari root jika perlu
        path.join(__dirname, 'src'),
                ],
                assetsPaths: [path.join(__dirname, 'src/assets')],
              },
            }],
          },
        ],
      },
    },
  },
});