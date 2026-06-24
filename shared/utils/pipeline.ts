export const PIPELINE_STEPS = {
  PRE_BUILD: [
    'scripts/generators/generate-paths.ts',
    'scripts/generators/generate-pricing-types.ts',
    'packages/env/cli/generate-env.ts',
    'packages/cli/generators/generate-active-locales.ts',
    'packages/page-system/cli/sync-system-pages.ts',
    'scripts/clean-cache.ts',
    'scripts/fetch-exchange-rates.ts',
    'scripts/generators/generate-fonts-css.ts',
    'packages/cli/generators/subset-fonts.ts',
    'packages/i18n/cli/sync-locales.ts',
    'packages/i18n/cli/generate-types.ts',
    'scripts/generators/generate-images.ts',
  ],
  SERVE: [
    'scripts/generators/generate-sitemap.ts',
    'scripts/generators/generate-manifest.ts',
    'scripts/generators/generate-robots.ts',
    'scripts/generators/generate-service-worker.ts',
  ],
  RSBUILD: 'rsbuild',
  POST_BUILD: ['scripts/compress.ts'],
} as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[keyof typeof PIPELINE_STEPS];
