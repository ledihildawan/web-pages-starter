import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { routes } from './config/router';
import njkPlugin from './plugins/vite-plugin-njk';

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
    rollupOptions: {
      input: Object.fromEntries(
        routes.map(route => {
          const name = route.path === '/' ? 'index' : route.path.replace(/^\//, '').replace(/\//g, '-');
          return [name, path.resolve(__dirname, route.view)];
        })
      )
    }
  }
});