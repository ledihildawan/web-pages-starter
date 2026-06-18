import { env } from '@config/env';
import { i18nConfig } from '@config/i18n';
import { getErrorPageSlugs } from '@page-system';
import { resolveRoot } from '@utils/common';
import { logBox } from './lib/logger';
import { writeFilePath } from './lib/write-file';

const OUTPUT_PUBLIC = resolveRoot('public', 'robots.txt');
const OUTPUT_DIST = resolveRoot('dist', 'robots.txt');

const basePath = env.BASE_PATH.replace(/\/?$/, '/');
const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;

const errorSlugs = getErrorPageSlugs(i18nConfig.defaultLocale);
const disallowRules = errorSlugs.map((slug) => `Disallow: ${basePath}${slug}.html`).join('\n');

const robots = `User-agent: *
Allow: ${basePath}
${disallowRules}
Disallow: ${basePath}service-worker.js

Sitemap: ${baseUrl}sitemap.xml
`;

writeFilePath(OUTPUT_PUBLIC, robots);
writeFilePath(OUTPUT_DIST, robots);

logBox('Generate Robots.txt', {
  Sitemap: baseUrl.slice(0, 28),
  Output: 'public/robots.txt',
});
