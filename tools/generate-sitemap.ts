#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { ROOT_PAGE } from '../src/configs/site';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

if (process.env.BUILD_PREVIEW === 'true') {
  config({ path: path.resolve(ROOT, '.env.development') });
} else {
  config({ path: path.resolve(ROOT, '.env.production') });
}

const SITE_URL = process.env.TUNNEL_URL || process.env.SITE_URL || 'http://localhost:8888';

const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const OUTPUT_FILE = path.join(ROOT, 'public', 'sitemap.xml');

const DEFAULT_PRIORITY = process.env.SITEMAP_DEFAULT_PRIORITY || '0.7';
const DEFAULT_CHANGEFREQ = process.env.SITEMAP_DEFAULT_CHANGEFREQ || 'weekly';

const getPages = () => {
  if (!fs.existsSync(PAGES_DIR)) {
    return [];
  }

  const EXCLUDED = ['404'];

  const entries = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !EXCLUDED.includes(entry.name))
    .map((entry) => entry.name)
    .sort();
};

const generateSitemap = () => {
  const pages = getPages();
  const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;

  const homePage = pages.includes(ROOT_PAGE) ? ROOT_PAGE : null;
  const otherPages = pages.filter((p) => p !== ROOT_PAGE);

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

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf-8');

  console.log('┌────────────────────────────────────────┐');
  console.log('│         🗺️ Sitemap Generated            │');
  console.log('├────────────────────────────────────────┤');
  console.log(`│  Pages:     ${String(urls.length).padEnd(24)}│`);
  console.log(`│  Base URL:  ${baseUrl.slice(0, 24).padEnd(24)}│`);
  console.log(`│  Output:    ${OUTPUT_FILE.replace(ROOT, '.').slice(0, 24).padEnd(24)}│`);
  console.log('└────────────────────────────────────────┘');
};

generateSitemap();