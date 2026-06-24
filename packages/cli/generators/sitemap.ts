import fs from 'node:fs';
import { dirname, join } from 'pathe';
import { fileURLToPath } from 'node:url';
import { log } from '@web-pages-starter/core/logger';
import { writeFilePath } from '@web-pages-starter/core/write-file';
import { lookup } from '@generated/paths';
import { scanPages } from '@page-system/scanner';
import { ROOT_PAGE, SYSTEM_PAGE_IDS } from '@page-system/system-pages';

const PAGE_PRIORITIES: Record<string, { priority: number; changefreq: string }> = {
  [ROOT_PAGE]: { priority: 1.0, changefreq: 'weekly' },
  about: { priority: 0.8, changefreq: 'monthly' },
  features: { priority: 0.8, changefreq: 'weekly' },
  pricing: { priority: 0.9, changefreq: 'weekly' },
  contact: { priority: 0.6, changefreq: 'monthly' },
};

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}

function getUrlEntry(pagePath: string, priority: number, changefreq: string): string {
  const loc = pagePath === ROOT_PAGE ? '/' : `/${pagePath}`;
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap(): string {
  const pagesDir = lookup('@pages');
  const pages = scanPages(pagesDir, '');

  const entries: string[] = [];

  for (const page of pages) {
    const pageName = page.name;

    if (pageName !== ROOT_PAGE && SYSTEM_PAGE_IDS.includes(pageName as (typeof SYSTEM_PAGE_IDS)[number])) continue;

    const config = PAGE_PRIORITIES[pageName] || { priority: 0.5, changefreq: 'weekly' };
    entries.push(getUrlEntry(pageName, config.priority, config.changefreq));
  }

  return entries.join('\n');
}

const TEMPLATE_DIR = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(join(TEMPLATE_DIR, '../templates/sitemap.xml'), 'utf-8');

const urls = generateSitemap();
const sitemapOutput = inject(template, { urls });

const OUTPUT_PUBLIC = lookup('@public', 'sitemap.xml');
const OUTPUT_DIST = lookup('@dist', 'sitemap.xml');

writeFilePath(OUTPUT_PUBLIC, sitemapOutput);
writeFilePath(OUTPUT_DIST, sitemapOutput);
log.success('Generated sitemap');
