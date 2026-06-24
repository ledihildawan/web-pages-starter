import fs from 'node:fs';
import { dirname, resolve, join } from 'pathe';
import { fileURLToPath } from 'node:url';
import { log } from '@web-pages-starter/core/logger';
import { writeFilePath } from '@web-pages-starter/core/write-file';

const TSCONFIG_PATH = resolve('.', 'tsconfig.json');
const OUTPUT_PATH = resolve('.', 'generated', 'paths.ts');

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}

const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf-8')) as {
  compilerOptions: { paths: Record<string, string[]> };
};

const seen = new Set<string>();
const rawEntries = Object.entries(tsconfig.compilerOptions.paths)
  .map(([key, targets]) => {
    const aliasKey = key.endsWith('/*') ? key.slice(0, -2) : key;
    let aliasPath = targets[0];
    if (aliasPath.endsWith('/*')) aliasPath = aliasPath.slice(0, -2);
    if (aliasPath.endsWith('/index.ts')) aliasPath = aliasPath.slice(0, -9);
    if (aliasPath.startsWith('./')) aliasPath = aliasPath.slice(2);
    return [aliasKey, aliasPath] as const;
  })
  .filter(([k]) => {
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .sort(([a], [b]) => a.localeCompare(b));

const keys = rawEntries.map(([k]) => k);
const aliasKeys = keys.map((k) => `  | '${k}'`).join('\n');
const aliasEntries = rawEntries.map(([k, v]) => `  '${k}': resolve('${v}'),`).join('\n');

const TEMPLATE_DIR = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(join(TEMPLATE_DIR, '../templates/paths.ts'), 'utf-8');
const output = inject(template, {
  generated_at: new Date().toISOString(),
  alias_keys: aliasKeys,
  alias_entries: aliasEntries,
});

writeFilePath(OUTPUT_PATH, output);
log.success(`Generated path aliases — ${keys.length} key(s): ${keys.join(', ')}`);
