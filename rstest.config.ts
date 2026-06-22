import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: 'happy-dom',
  include: ['packages/**/*.test.ts'],
  exclude: ['packages/simple-nunjucks-loader/**'],
});
