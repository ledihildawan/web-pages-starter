import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { routes } from './config/router';
import njkPlugin from './plugins/vite-plugin-njk';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    tailwindcss(),
    njkPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, 'node_modules'),
      '@features': path.resolve(__dirname, './features'),
      '@utils': path.resolve(__dirname, './utils'),
      '@config': path.resolve(__dirname, './config'),
    }
  },
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'scripts/main.ts'),
        'main-style': path.resolve(__dirname, 'styles/main.css'),
        'home': path.resolve(__dirname, 'features/home/home.ts'),
        'home-style': path.resolve(__dirname, 'features/home/home.css'),
        'about': path.resolve(__dirname, 'features/about/about.ts'),
        'about-style': path.resolve(__dirname, 'features/about/about.css'),
      },
      output: {
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]'
      }
    }
  },
  server: {
    historyApiFallback: true
  }
});