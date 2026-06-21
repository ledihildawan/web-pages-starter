import { inject, loadTemplate } from '@codegen';
import { i18nConfig } from '@config/i18n';
import { PUBLIC_FILENAMES } from '@constants';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { getErrorPageSlugs } from '@page-system';
import { logBox } from '@utils/logger';
import { computeStringHash, isCacheValid, restoreCache, storeCache } from '@utils/pipeline-cache';
import { writeFilePath } from '@utils/write-file';

const OUTPUT_PUBLIC = lookup('@public', PUBLIC_FILENAMES.robots);
const OUTPUT_DIST = lookup('@dist', PUBLIC_FILENAMES.robots);
const CACHE_KEY = 'robots';

const sourceHash = computeStringHash(
  JSON.stringify({ i18nConfig, env: { BASE_PATH: env.BASE_PATH, SITE_URL: env.SITE_URL } }),
);

if (isCacheValid(CACHE_KEY, sourceHash)) {
  restoreCache(CACHE_KEY, OUTPUT_PUBLIC);
  if (OUTPUT_PUBLIC !== OUTPUT_DIST) {
    restoreCache(CACHE_KEY, OUTPUT_DIST);
  }
  const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;
  logBox('Generate Robots', {
    Sitemap: baseUrl.slice(0, 28),
    Output: `public/${PUBLIC_FILENAMES.robots} (cached)`,
  });
  process.exit(0);
}

const basePath = env.BASE_PATH.replace(/\/?$/, '/');
const baseUrl = env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;

const errorSlugs = getErrorPageSlugs(i18nConfig.defaultLocale);
const disallowRules = errorSlugs.map((slug) => `Disallow: ${basePath}${slug}`).join('\n');

const template = loadTemplate('robots.txt');
const robots = inject(template, {
  base_path: basePath,
  disallow_rules: disallowRules,
  sitemap_url: `${baseUrl}${PUBLIC_FILENAMES.sitemap}`,
});

writeFilePath(OUTPUT_PUBLIC, robots);
writeFilePath(OUTPUT_DIST, robots);

storeCache(CACHE_KEY, OUTPUT_PUBLIC, sourceHash);

logBox('Generate Robots', {
  Sitemap: baseUrl.slice(0, 28),
  Output: `public/${PUBLIC_FILENAMES.robots}`,
});
