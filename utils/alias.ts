import fs from 'node:fs';
import path from 'node:path';

const tsconfig = JSON.parse(fs.readFileSync(path.resolve('tsconfig.json'), 'utf-8')) as {
  compilerOptions: { paths: Record<string, string[]> };
};

const rawPaths = tsconfig.compilerOptions.paths;
const aliasMap = new Map<string, string>();

for (const [key, targets] of Object.entries(rawPaths)) {
  let aliasKey = key;
  let aliasPath = targets[0];

  if (aliasKey.endsWith('/*')) aliasKey = aliasKey.slice(0, -2);
  if (aliasPath.endsWith('/*')) aliasPath = aliasPath.slice(0, -2);
  if (aliasPath.endsWith('/index.ts')) aliasPath = aliasPath.slice(0, -9);

  if (!aliasMap.has(aliasKey)) {
    aliasMap.set(aliasKey, path.resolve(aliasPath));
  }
}

export const alias: Record<string, string> = Object.fromEntries(aliasMap);
