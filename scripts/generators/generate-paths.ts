import fs from 'node:fs';
import path from 'node:path';
import { inject, loadTemplate } from '@codegen';
import { lookup } from '@generated/paths';
import { log } from '@scripts/lib/logger';
import { writeFilePath } from '@scripts/lib/write-file';

const TSCONFIG_PATH = path.resolve('.', 'tsconfig.json');
const OUTPUT_PATH = lookup('@generated', 'paths.ts');

const tsconfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf-8')) as {
  compilerOptions: { paths: Record<string, string[]> };
};

const entries = Object.entries(tsconfig.compilerOptions.paths)
  .map(([key, targets]) => {
    const aliasKey = key.endsWith('/*') ? key.slice(0, -2) : key;
    let aliasPath = targets[0];
    if (aliasPath.endsWith('/*')) aliasPath = aliasPath.slice(0, -2);
    if (aliasPath.endsWith('/index.ts')) aliasPath = aliasPath.slice(0, -9);
    if (aliasPath.startsWith('./')) aliasPath = aliasPath.slice(2);
    return [aliasKey, aliasPath] as const;
  })
  .filter(([k], i, arr) => arr.findIndex(([k2]) => k2 === k) === i)
  .sort(([a], [b]) => a.localeCompare(b));

const keys = entries.map(([k]) => k);
const aliasKeys = keys.map((k) => `  | '${k}'`).join('\n');
const aliasEntries = entries.map(([k, v]) => `  '${k}': path.resolve('${v}'),`).join('\n');

const template = loadTemplate('paths.ts');
const output = inject(template, {
  generated_at: new Date().toISOString(),
  alias_keys: aliasKeys,
  alias_entries: aliasEntries,
});

writeFilePath(OUTPUT_PATH, output);
log.success(`Generated path aliases — ${keys.length} key(s): ${keys.join(', ')}`);
