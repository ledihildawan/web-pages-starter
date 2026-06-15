import '../configs/env';
import { getErrorPageSlugs } from '@page-engine';
import { resolveRoot } from '@utils/paths';
import { i18nConfig } from '../configs/i18n';
import { logBox } from './lib/logger';
import { SITE_URL } from './lib/site-url';
import { writeFilePath } from './lib/write-file';

const OUTPUT_PUBLIC = resolveRoot('public', 'robots.txt');

const basePath = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const baseUrl = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;

const errorSlugs = getErrorPageSlugs(i18nConfig.defaultLocale);
const disallowRules = errorSlugs
  .map((slug) => `Disallow: ${basePath}${slug}.html`)
  .join('\n');

const robots = `User-agent: *
Allow: ${basePath}
${disallowRules}
Disallow: ${basePath}sw.js

Sitemap: ${baseUrl}sitemap.xml
`;

writeFilePath(OUTPUT_PUBLIC, robots);

logBox('Generate Robots.txt', {
  Sitemap: baseUrl.slice(0, 28),
  Output: 'public/robots.txt',
});
