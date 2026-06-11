import fs from 'node:fs';
import path from 'node:path';
import '../src/configs/env';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { loadGlobalData } from '../src/scripts/utils/json5';
import { log } from './shared/logger';

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

const manifest = {
  name: siteName,
  short_name: siteName,
  description: siteDescription,
  start_url: '.',
  display: 'standalone',
  background_color: themeColor,
  theme_color: themeColor,
  orientation: 'any',
  scope: '.',
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
      url: './',
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

const json = `${JSON.stringify(manifest, null, 2)}\n`;

fs.writeFileSync(OUTPUT_PUBLIC, json, 'utf-8');

log.info('┌────────────────────────────────────────┐');
log.info('│         Generate Manifest              │');
log.info('├────────────────────────────────────────┤');
log.info(`│  Name:      ${(siteName as string).padEnd(26)}│`);
log.info(`│  Lang:      ${defaultLocale.padEnd(26)}│`);
log.info(`│  Theme:     ${themeColor.padEnd(26)}│`);
log.info(`│  Output:    public/manifest.json       │`);
log.info('└────────────────────────────────────────┘');
