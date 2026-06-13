import path from 'node:path';
import '../src/configs/env';
import { i18nConfig } from '../src/configs/i18n';
import { getErrorPageSlugs } from '../src/configs/pages';
import { PATHS } from '../src/configs/paths';
import { logBox } from './shared/logger';
import { SITE_URL } from './shared/site-url';
import { writeFilePath } from './shared/write-file';

const OUTPUT_PUBLIC = path.join(PATHS.ROOT, 'public', 'robots.txt');

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
