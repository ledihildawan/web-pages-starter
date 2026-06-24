import fs from 'node:fs';
import { dirname, join } from 'pathe';
import { fileURLToPath } from 'node:url';
import { log } from '@core/logger';
import { writeFilePath } from '@core/write-file';
import { lookup } from '@generated/paths';

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}

const TEMPLATE_DIR = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(join(TEMPLATE_DIR, '../templates/robots.txt'), 'utf-8');

const output = inject(template, {
  base_path: '/',
  disallow_rules: '',
  sitemap_url: '/sitemap.xml',
});

const OUTPUT_PUBLIC = lookup('@public', 'robots.txt');
const OUTPUT_DIST = lookup('@dist', 'robots.txt');

writeFilePath(OUTPUT_PUBLIC, output);
writeFilePath(OUTPUT_DIST, output);
log.success('Generated robots template');
