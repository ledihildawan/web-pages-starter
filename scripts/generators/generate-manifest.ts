import { inject, loadTemplate } from '@codegen';
import { i18nConfig } from '@config/i18n';
import { PUBLIC_FILENAMES } from '@constants';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { loadGlobalData } from '@utils/json5';
import { logBox } from '@utils/logger';
import { computeStringHash, isCacheValid, restoreCache, storeCache } from '@utils/pipeline-cache';
import { writeFilePath } from '@utils/write-file';

const OUTPUT_PUBLIC = lookup('@public', PUBLIC_FILENAMES.manifest);
const OUTPUT_DIST = lookup('@dist', PUBLIC_FILENAMES.manifest);
const CACHE_KEY = 'manifest';

const dataDir = lookup('@data');
const global = loadGlobalData(dataDir);

const sourceHash = computeStringHash(
  JSON.stringify({ global, i18nConfig, env: { BASE_PATH: env.BASE_PATH, SITE_URL: env.SITE_URL } }),
);

if (isCacheValid(CACHE_KEY, sourceHash)) {
  restoreCache(CACHE_KEY, OUTPUT_PUBLIC);
  if (OUTPUT_PUBLIC !== OUTPUT_DIST) {
    restoreCache(CACHE_KEY, OUTPUT_DIST);
  }
  logBox('Generate Manifest', {
    Name: (global.site_name as string) || 'Starter',
    Lang: i18nConfig.defaultLocale,
    Theme: ((global.seo as Record<string, unknown>)?.theme_color as string) || '#020617',
    Output: `public/${PUBLIC_FILENAMES.manifest} (cached)`,
  });
  process.exit(0);
}

const siteName = (global.site_name as string) || 'Starter';
const siteDescription = (global.site_description as string) || 'A modern web application with i18n support';
const seo = (global.seo as Record<string, unknown>) || {};
const themeColor = (seo.theme_color as string) || '#020617';

const basePath = env.BASE_PATH.replace(/\/+$/, '');

const manifest = {
  name: siteName,
  short_name: siteName,
  description: siteDescription,
  start_url: basePath ? `${basePath}/` : './',
  display: 'standalone',
  background_color: themeColor,
  theme_color: themeColor,
  orientation: 'any',
  scope: basePath ? `${basePath}/` : '.',
  dir: 'ltr',
  lang: i18nConfig.defaultLocale,
  categories: ['productivity', 'utilities', 'developer'],
  icons: [
    {
      src: 'favicon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any',
    },
  ],
  screenshots: [],
  shortcuts: [
    {
      name: 'Home',
      short_name: 'Home',
      description: `Go to ${siteName} home page`,
      url: basePath ? `${basePath}/` : './',
      icons: [
        {
          src: 'favicon.svg',
          sizes: 'any',
        },
      ],
    },
  ],
  related_applications: [],
  prefer_related_applications: false,
};

const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

const template = loadTemplate('manifest.json');
const output = inject(template, {
  manifest: manifestJson,
});

writeFilePath(OUTPUT_PUBLIC, output);
writeFilePath(OUTPUT_DIST, output);

storeCache(CACHE_KEY, OUTPUT_PUBLIC, sourceHash);

logBox('Generate Manifest', {
  Name: siteName,
  Lang: i18nConfig.defaultLocale,
  Theme: themeColor,
  Output: `public/${PUBLIC_FILENAMES.manifest}`,
});
