import { defineConfig, type PostCSSOptions } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { CopyRspackPlugin } from '@rspack/core';
import { minify } from 'html-minifier-terser'; // Import ini dikembalikan
import path from 'path';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  // 1. Plugins
  plugins: [
    pluginImageCompress(
      { use: 'jpeg', quality: 50 },
      { use: 'png' }, // Default optimal
      { use: 'webp', quality: 50 }
    ),
  ],

  // 2. Server & Dev Experience
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
    entry: {
      index: './src/pages/index/index.ts',
      about: './src/pages/about/about.ts',
      pricing: './src/pages/pricing/pricing.ts',
      features: './src/pages/features/features.ts',
    },
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
    // 3. RESTORED: HTML Minifier Terser Configuration
    // Menggunakan function agar lebih aman secara tipe data dan logika
    htmlPlugin: (config) => {
      if (process.env.NODE_ENV === 'production') {
        // Kita override fungsi minify bawaan dengan html-minifier-terser
        config.minify = (html) => {
          return minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true, // Minify CSS inline di dalam <style>
            minifyJS: true,  // Minify JS inline di dalam <script>
          });
        };
      }
      // Jika mode development, biarkan config apa adanya (tanpa minify)
      return config;
    },

    // 4. PostCSS (Tailwind v4)
    postcss: (config) => {
      config.postcssOptions ??= {};
      const opts = config.postcssOptions as PostCSSOptions;
      opts.plugins ??= [];
      opts.plugins.push(tailwindcss());
    },

    // 5. Rspack Native Plugins & Loaders
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