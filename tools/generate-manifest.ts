import path from 'node:path';
import '../src/configs/env';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { loadGlobalData } from '../src/scripts/utils/json5';
import { logBox } from './shared/logger';
import { writeFilePath } from './shared/write-file';

const OUTPUT_PUBLIC = path.join(PATHS.ROOT, 'public', 'manifest.json');

const dataDir = path.join(PATHS.ROOT, PATHS.SRC, 'data');
const global = loadGlobalData(dataDir);

const siteName = (global.site_name as string) || 'Starter';
const siteDescription =
  (global.site_description as string) ||
  'A modern web application with i18n support';
const seo = (global.seo as Record<string, unknown>) || {};
const themeColor = (seo.theme_color as string) || '#020617';
const defaultLocale = i18nConfig.defaultLocale;

const basePath = process.env.BASE_PATH?.replace(/\/+$/, '') || '';

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
  lang: defaultLocale,
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

writeFilePath(OUTPUT_PUBLIC, `${JSON.stringify(manifest, null, 2)}\n`);

logBox('Generate Manifest', {
  Name: siteName,
  Lang: defaultLocale,
  Theme: themeColor,
  Output: 'public/manifest.json',
});
