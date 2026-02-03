import { defineConfig, type PostCSSOptions } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { CopyRspackPlugin } from '@rspack/core';
import { minify } from 'html-minifier-terser';
import path from 'path';
import fs from 'node:fs'; // Tambahan: Import module file system
import tailwindcss from '@tailwindcss/postcss';

// --- HELPER FUNCTION UNTUK OTOMATISASI ENTRY ---
const getEntries = () => {
  const pagesDir = path.resolve(__dirname, 'src/pages');
  const entries: Record<string, string> = {};

  // Cek apakah folder pages ada
  if (fs.existsSync(pagesDir)) {
    // Baca semua folder di dalam src/pages
    const folders = fs.readdirSync(pagesDir);

    folders.forEach((folder) => {
      // Pola: src/pages/[nama]/[nama].ts
      const entryFile = path.join(pagesDir, folder, `${folder}.ts`);
      
      // Jika file .ts nya ada, masukkan ke entry list
      if (fs.existsSync(entryFile)) {
        entries[folder] = entryFile;
      }
    });
  }
  return entries;
};
// ----------------------------------------------

export default defineConfig({
  plugins: [
    pluginImageCompress(
      { use: 'jpeg', quality: 50 },
      { use: 'png' },
      { use: 'webp', quality: 50 }
    ),
  ],

  server: {
    port: 3000,
    open: true,
    strictPort: true,
  },

  dev: {
    watchFiles: {
      paths: ['src/**/*.njk'],
      options: { usePolling: true },
    },
  },

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  source: {
    preEntry: ['./src/assets/scripts/global.ts'],
    
    // UBAH BAGIAN INI: Panggil fungsi helper tadi
    // Hasilnya sama persis dengan manual, tapi otomatis nambah
    entry: getEntries(), 
  },

  output: {
    distPath: { js: 'scripts', css: 'styles', image: 'assets/images' },
    assetPrefix: './',
    cleanDistPath: true,
    target: 'web', 
    sourceMap: process.env.NODE_ENV !== 'production' 
      ? { js: 'cheap-module-source-map', css: true } 
      : { js: false, css: false },
  },

  html: {
    // Bagian ini sudah dinamis, jadi aman!
    template: ({ entryName }) => `./src/pages/${entryName}/${entryName}.njk`,
    templateParameters: {
      asset: (f: string) => `assets/${f.startsWith('/') ? f.substring(1) : f}`,
    },
    meta: {
      viewport: 'width=device-width, initial-scale=1.0',
      charset: { charset: 'UTF-8' },
    },
    title: 'My Rsbuild App',
  },

  tools: {
    htmlPlugin: (config) => {
      if (process.env.NODE_ENV === 'production') {
        config.minify = (html) => {
          return minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
          });
        };
      }
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
            globOptions: { ignore: ['**/*.ts', '**/*.css', '**/*.njk'] },
            noErrorOnMissing: true, 
          }],
        }),
      ],
      module: {
        rules: [
          {
            test: /\.njk$/,
            use: [{
              loader: 'simple-nunjucks-loader',
              options: {
                searchPaths: [
                  path.join(__dirname, 'src/pages'),
                  path.join(__dirname, 'src/layouts'),
                  path.join(__dirname, 'src/partials')
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