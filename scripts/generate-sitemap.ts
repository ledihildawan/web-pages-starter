import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import '../configs/env';
import { i18nConfig } from '../configs/i18n';
import { getErrorPageSlugs, getRootPageSlug } from '../configs/pages';
import { PATHS } from '../configs/paths';
import { log, logBox } from './shared/logger';
import { SITE_URL } from './shared/site-url';
import { writeFilePath } from './shared/write-file';

const cliArgs = process.argv.slice(2);
const distOnly = cliArgs.includes('--dist-only');
const isPreviewRegen = process.env.FOR_PREVIEW === 'true';

const PAGES_DIR = path.join(PATHS.ROOT, 'pages');
const OUTPUT_PUBLIC = path.join(PATHS.ROOT, 'public', 'sitemap.xml');
const OUTPUT_DIST = path.join(PATHS.ROOT, 'dist', 'sitemap.xml');

const DEFAULT_PRIORITY = process.env.SITEMAP_DEFAULT_PRIORITY || '0.7';
const DEFAULT_CHANGEFREQ = process.env.SITEMAP_DEFAULT_CHANGEFREQ || 'weekly';

const scanPageDirs = (
  dir: string,
  basePath: string,
  excluded: string[],
): string[] => {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    if (excluded.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const hasIndex = fs.existsSync(path.join(fullPath, 'index.njk'));

    if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
      results.push(...scanPageDirs(fullPath, basePath, excluded));
    } else if (hasIndex) {
      const name = basePath ? `${basePath}/${entry.name}` : entry.name;
      results.push(name);
    }
  }
  return results;
};

const getPages = () => {
  const EXCLUDED = getErrorPageSlugs(i18nConfig.defaultLocale);
  return scanPageDirs(PAGES_DIR, '', EXCLUDED).sort();
};

const generateSitemap = () => {
  const pages = getPages();
  const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;

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
    const priority =
      !homePage && index === 0 ? '1.0' : index === 0 ? '0.9' : DEFAULT_PRIORITY;
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
      Output: OUTPUT_PUBLIC.replace(PATHS.ROOT, '.').slice(0, 24),
    });
  }
};

try {
  generateSitemap();
} catch (err) {
  log.error(`Error: Failed to generate sitemap — ${err}`);
  process.exit(1);
}
