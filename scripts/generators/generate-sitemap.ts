import process from 'node:process';
import { inject, loadTemplate } from '@codegen';
import { i18nConfig } from '@config/i18n';
import { LOCALE_CODES } from '@generated/active-locales-data';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { getErrorPageSlugs, getRootPageSlug, scanPages } from '@page-system';
import { log, logBox } from '@scripts/lib/logger';
import { writeFilePath } from '@scripts/lib/write-file';

const cliArgs = process.argv.slice(2);
const distOnly = cliArgs.includes('--dist-only');

const PAGES_DIR = lookup('@pages');
const OUTPUT_PUBLIC = lookup('@public', 'sitemap.xml');
const OUTPUT_DIST = lookup('@dist', 'sitemap.xml');

const DEFAULT_PRIORITY = env.SITEMAP_DEFAULT_PRIORITY;
const DEFAULT_CHANGEFREQ = env.SITEMAP_DEFAULT_CHANGEFREQ;

const getPages = () => {
  const EXCLUDED = getErrorPageSlugs(i18nConfig.defaultLocale);
  return scanPages(PAGES_DIR, '')
    .map((p) => p.name)
    .filter((name) => !EXCLUDED.includes(name))
    .sort();
};

const getPagePath = (page: string, rootSlug: string): string => {
  return page === rootSlug ? '/' : `/${page}`;
};

const generateHreflangLinks = (baseUrl: string, page: string, rootSlug: string, locales: string[]): string => {
  const pagePath = getPagePath(page, rootSlug);
  const links: string[] = [];

  for (const locale of locales) {
    const localePrefix = locale === i18nConfig.defaultLocale ? '' : `/${locale}`;
    links.push(`    <xhtml:link rel="alternate" hreflang="${locale}" href="${baseUrl}${localePrefix}${pagePath}"/>`);
  }

  links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${pagePath}"/>`);

  return links.join('\n');
};

const generateSitemap = () => {
  const pages = getPages();
  const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL.slice(0, -1) : env.SITE_URL;
  const locales = LOCALE_CODES;

  const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
  const homePage = pages.includes(rootSlug) ? rootSlug : null;
  const otherPages = pages.filter((p) => p !== rootSlug);

  const urls: string[] = [];

  const addPageUrl = (page: string, priority: string) => {
    const hreflangLinks = generateHreflangLinks(baseUrl, page, rootSlug, locales);
    const pagePath = getPagePath(page, rootSlug);
    const lastmod = new Date().toISOString().split('T')[0];
    urls.push(`  <url>
    <loc>${baseUrl}${pagePath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${DEFAULT_CHANGEFREQ}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks}
  </url>`);
  };

  if (homePage) {
    addPageUrl(homePage, '1.0');
  }

  otherPages.forEach((page, index) => {
    const priority = !homePage && index === 0 ? '1.0' : index === 0 ? '0.9' : DEFAULT_PRIORITY;
    addPageUrl(page, priority);
  });

  const template = loadTemplate('sitemap.xml');
  const xml = inject(template, {
    urls: urls.join('\n'),
  });

  if (!distOnly) {
    writeFilePath(OUTPUT_PUBLIC, xml);
  }
  writeFilePath(OUTPUT_DIST, xml);

  logBox('Generate Sitemap', {
    Pages: urls.length,
    Locales: locales.length,
    'Base URL': baseUrl.slice(0, 24),
    Output: OUTPUT_PUBLIC.replace(process.cwd(), '.').slice(0, 24),
  });
};

try {
  generateSitemap();
} catch (err) {
  log.error(`Error: Failed to generate sitemap — ${err}`);
  process.exit(1);
}
