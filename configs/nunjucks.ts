import fs from 'node:fs';
import path from 'node:path';
import { alias } from '@generated/paths';

const EXCLUDE_PATTERNS = ['node_modules', 'dist', 'rsbuild-out', 'temp', '.git'];

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isSubdirectoryOf(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function getNunjucksPaths() {
  const searchPaths: string[] = [];
  const assetsPaths: string[] = [];
  const projectRoot = alias['@'];

  for (const [aliasKey, resolvedPath] of Object.entries(alias)) {
    if (!isDirectory(resolvedPath)) continue;

    const normalized = path.normalize(resolvedPath);
    const shouldExclude = EXCLUDE_PATTERNS.some((pattern) => normalized.includes(pattern));
    if (shouldExclude) continue;

    if (aliasKey !== '@' && isSubdirectoryOf(projectRoot, resolvedPath)) {
      continue;
    }

    searchPaths.push(resolvedPath);

    if (normalized.includes(`${path.sep}assets${path.sep}`) || normalized.endsWith('assets')) {
      assetsPaths.push(resolvedPath);
    }
  }

  return { searchPaths, assetsPaths };
}
