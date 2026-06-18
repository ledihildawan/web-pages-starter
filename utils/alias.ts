import path from 'node:path';
import tsconfig from '../tsconfig.json';

const rawPaths = tsconfig.compilerOptions.paths as Record<string, string[]>;
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
