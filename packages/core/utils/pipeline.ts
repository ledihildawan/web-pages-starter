export const PIPELINE_STEPS = {
  PRE_BUILD: [
    'packages/cli/generators/paths.ts',
    'packages/cli/generators/pricing-types.ts',
    'packages/cli/generators/env.ts',
    'packages/i18n/cli/generate-active-locales.ts',
    'packages/page-system/cli/sync-system-pages.ts',
    'packages/cli/scripts/fetch-exchange-rates.ts',
    'packages/cli/generators/fonts-css.ts',
    'packages/cli/generators/subset-fonts.ts',
    'packages/i18n/cli/sync-locales.ts',
    'packages/i18n/cli/generate-types.ts',
    'packages/cli/generators/images.ts',
  ],
  SERVE: [
    'packages/cli/generators/sitemap.ts',
    'packages/cli/generators/manifest.ts',
    'packages/cli/generators/robots.ts',
    'packages/cli/generators/service-worker.ts',
  ],
  RSBUILD: 'rsbuild',
  POST_BUILD: ['packages/cli/generators/compress.ts'],
} as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[keyof typeof PIPELINE_STEPS];
