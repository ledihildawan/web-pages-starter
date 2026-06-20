import { createHash } from 'node:crypto';
import { inject, loadTemplate } from '@codegen';
import { i18nConfig } from '@config/i18n';
import { lookup } from '@generated/paths';
import { I18N_ASSET_DIR } from '@i18n';
import { getErrorPageSlugs, getRootPageSlug, getSystemPageSlug } from '@page-system';
import { logBox } from '@scripts/lib/logger';
import { writeFilePath } from '@scripts/lib/write-file';

const OUTPUT = lookup('@public', 'service-worker.js');

const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
const [notFoundSlug, unauthorizedSlug, forbiddenSlug, serverErrorSlug, maintenanceSlug, offlineErrorSlug] =
  getErrorPageSlugs(i18nConfig.defaultLocale);
const offlineSlug = getSystemPageSlug('offline', i18nConfig.defaultLocale);

const contentToHash = [
  rootSlug,
  notFoundSlug,
  unauthorizedSlug,
  forbiddenSlug,
  serverErrorSlug,
  maintenanceSlug,
  offlineSlug,
  offlineErrorSlug,
  I18N_ASSET_DIR,
  Date.now().toString(36),
].join('|');

const CACHE_VERSION = `starter-${createHash('sha256').update(contentToHash).digest('hex').slice(0, 8)}`;

const template = loadTemplate('service-worker.js');
const swContent = inject(template, {
  generated_at: new Date().toISOString(),
  cache_version: `'${CACHE_VERSION}'`,
  not_found_slug: notFoundSlug,
  unauthorized_slug: unauthorizedSlug,
  forbidden_slug: forbiddenSlug,
  server_error_slug: serverErrorSlug,
  maintenance_slug: maintenanceSlug,
  offline_error_slug: offlineErrorSlug,
  offline_slug: offlineSlug,
  i18n_asset_dir: I18N_ASSET_DIR,
});

writeFilePath(OUTPUT, swContent);

logBox('Generate Service Worker', {
  Version: CACHE_VERSION,
  Pages: String([rootSlug, ...getErrorPageSlugs(i18nConfig.defaultLocale)].length),
  Output: 'public/service-worker.js',
});
