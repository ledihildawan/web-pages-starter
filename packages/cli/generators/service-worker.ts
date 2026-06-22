import fs from 'node:fs';
import { dirname, join } from 'pathe';
import { fileURLToPath } from 'node:url';
import { log } from '@core/utils/logger';
import { writeFilePath } from '@core/utils/write-file';
import { lookup } from '@generated/paths';

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}

const TEMPLATE_DIR = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(join(TEMPLATE_DIR, '../templates/service-worker.js'), 'utf-8');

const output = inject(template, {
  cache_version: "'starter-v1'",
  not_found_slug: '404',
  unauthorized_slug: '401',
  forbidden_slug: '403',
  server_error_slug: '500',
  maintenance_slug: '503',
  offline_error_slug: 'offline',
  offline_slug: 'offline',
  i18n_asset_dir: 'assets/locales',
});

const OUTPUT = lookup('@public', 'service-worker.js');

writeFilePath(OUTPUT, output);
log.success('Generated service-worker template');
