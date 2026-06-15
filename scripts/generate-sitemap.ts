import '@config/env';

import process from 'node:process';
import { env } from '@config/env';
import { i18nConfig } from '@config/i18n';
import { ROOT_PATH, resolveRoot } from '@config/paths';
import { getErrorPageSlugs, getRootPageSlug, scanPages } from '@page-engine';
import { log, logBox } from './lib/logger';
import { writeFilePath } from './lib/write-file';

const cliArgs = process.argv.slice(2);
const distOnly = cliArgs.includes('--dist-only');
const isPreviewRegen = env.FOR_PREVIEW;

const PAGES_DIR = resolveRoot('pages');
const OUTPUT_PUBLIC = resolveRoot('public', 'sitemap.xml');
const OUTPUT_DIST = resolveRoot('dist', 'sitemap.xml');

const DEFAULT_PRIORITY = env.SITEMAP_DEFAULT_PRIORITY;
const DEFAULT_CHANGEFREQ = env.SITEMAP_DEFAULT_CHANGEFREQ;

const getPages = () => {
  const EXCLUDED = getErrorPageSlugs(i18nConfig.defaultLocale);
  return scanPages(PAGES_DIR, '')
    .map((p) => p.name)
    .filter((name) => !EXCLUDED.includes(name))
    .sort();
};

const generateSitemap = () => {
  const pages = getPages();
  const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL.slice(0, -1) : env.SITE_URL;

  const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
  const homePage = pages.includes(rootSlug) ? rootSlug : null;
  const otherPages = pages.filter((p) => p !== rootSlug);

  const urls: string[] = [];

  if (homePage) {
    urls.push(`  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>${DEFAULT_CHANGEFREQ}</changefreq>
    <priority>1.0</priority>
  </url>`);
  }

  otherPages.forEach((page, index) => {
    const priority = !homePage && index === 0 ? '1.0' : index === 0 ? '0.9' : DEFAULT_PRIORITY;
    urls.push(`  <url>
    <loc>${baseUrl}/${page}</loc>
    <changefreq>${DEFAULT_CHANGEFREQ}</changefreq>
    <priority>${priority}</priority>
  </url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  if (!distOnly && !isPreviewRegen) {
    writeFilePath(OUTPUT_PUBLIC, xml);
  }
  writeFilePath(OUTPUT_DIST, xml);

  if (!isPreviewRegen) {
    logBox('Generate Sitemap', {
      Pages: urls.length,
      'Base URL': baseUrl.slice(0, 24),
      Output: OUTPUT_PUBLIC.replace(ROOT_PATH, '.').slice(0, 24),
    });
  }
};

try {
  generateSitemap();
} catch (err) {
  log.error(`Error: Failed to generate sitemap — ${err}`);
  process.exit(1);
}
