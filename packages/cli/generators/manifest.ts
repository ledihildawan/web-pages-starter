import fs from 'node:fs';
import path from 'node:path';
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

const TEMPLATE_DIR = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(TEMPLATE_DIR, '../templates/manifest.json'), 'utf-8');

const manifestJson = JSON.stringify({ name: 'App' }, null, 2);
const output = inject(template, { manifest: manifestJson });

const OUTPUT_PUBLIC = lookup('@public', 'manifest.json');
const OUTPUT_DIST = lookup('@dist', 'manifest.json');

writeFilePath(OUTPUT_PUBLIC, output);
writeFilePath(OUTPUT_DIST, output);
log.success('Generated manifest template');
