import fs from 'node:fs';
import { lookup } from '@utils/paths';
import { log } from '../lib/logger';
import { writeFilePath } from '../lib/write-file';

const tsconfig = JSON.parse(fs.readFileSync(lookup('@', 'tsconfig.json'), 'utf-8')) as {
  compilerOptions: { paths: Record<string, string[]> };
};

const keys = Object.keys(tsconfig.compilerOptions.paths)
  .map((k) => (k.endsWith('/*') ? k.slice(0, -2) : k))
  .filter((k, i, arr) => arr.indexOf(k) === i)
  .sort();

const output = `export type AliasKey = ${keys.map((k) => `  | '${k}'`).join('\n')};\n`;

const outputFile = lookup('@', 'generated', 'alias-keys.ts');
writeFilePath(outputFile, output);
log.success(`Generated alias keys — ${keys.length} key(s): ${keys.join(', ')}`);
