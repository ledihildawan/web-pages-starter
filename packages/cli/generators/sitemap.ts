import fs from 'node:fs';
import path from 'node:path';
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

const TEMPLATE_DIR = path.dirname(new URL(import.meta.url).pathname);
const template = fs.readFileSync(path.join(TEMPLATE_DIR, '../templates/sitemap.xml'), 'utf-8');

const sitemapOutput = inject(template, { urls: '' });

const OUTPUT_PUBLIC = lookup('@public', 'sitemap.xml');
const OUTPUT_DIST = lookup('@dist', 'sitemap.xml');

writeFilePath(OUTPUT_PUBLIC, sitemapOutput);
writeFilePath(OUTPUT_DIST, sitemapOutput);
log.success('Generated sitemap template');
