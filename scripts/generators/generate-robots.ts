import { inject, loadTemplate } from '@codegen';
import { i18nConfig } from '@config/i18n';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { getErrorPageSlugs } from '@page-system';
import { logBox } from '@scripts/lib/logger';
import { writeFilePath } from '@scripts/lib/write-file';

const OUTPUT_PUBLIC = lookup('@public', 'robots.txt');
const OUTPUT_DIST = lookup('@dist', 'robots.txt');

const basePath = env.BASE_PATH.replace(/\/?$/, '/');
const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;

const errorSlugs = getErrorPageSlugs(i18nConfig.defaultLocale);
const disallowRules = errorSlugs.map((slug) => `Disallow: ${basePath}${slug}`).join('\n');

const template = loadTemplate('robots.txt');
const robots = inject(template, {
  base_path: basePath,
  disallow_rules: disallowRules,
  sitemap_url: `${baseUrl}sitemap.xml`,
});

writeFilePath(OUTPUT_PUBLIC, robots);
writeFilePath(OUTPUT_DIST, robots);

logBox('Generate Robots.txt', {
  Sitemap: baseUrl.slice(0, 28),
  Output: 'public/robots.txt',
});
