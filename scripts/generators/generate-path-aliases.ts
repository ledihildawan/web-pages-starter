import fs from 'node:fs';
import { lookup } from '@utils/paths';
import { log } from '../lib/logger';
import { writeFilePath } from '../lib/write-file';

const tsconfig = JSON.parse(fs.readFileSync(lookup('@', 'tsconfig.json'), 'utf-8')) as {
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
const lines = entries.map(([k, v]) => `  '${k}': path.resolve('${v}'),`).join('\n');

const output = `import path from 'node:path';\n\nexport type AliasKey =\n${keys.map((k) => `  | '${k}'`).join('\n')};\n\nexport const alias: Record<AliasKey, string> = {\n${lines}\n};\n`;

writeFilePath(lookup('@', 'generated', 'path-aliases.ts'), output);
log.success(`Generated path aliases — ${keys.length} key(s): ${keys.join(', ')}`);
