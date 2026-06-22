import fs from 'node:fs';
import { join } from 'pathe';

export interface ScannedPage {
  name: string;
  dir: string;
}

export const isGroup = (name: string): boolean => name.startsWith('(') && name.endsWith(')');

export const isSlugDir = (name: string): boolean => name.startsWith('[') && name.endsWith(']');

export const isPrivateDir = (name: string): boolean => name.startsWith('_');

export const scanPages = (dir: string, basePath: string): ScannedPage[] => {
  const results: ScannedPage[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (isPrivateDir(entry.name)) continue;
    if (isSlugDir(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    const hasIndex = fs.existsSync(join(fullPath, 'index.njk'));

    if (isGroup(entry.name)) {
      results.push(...scanPages(fullPath, basePath));
    } else if (hasIndex) {
      const name = basePath ? `${basePath}/${entry.name}` : entry.name;
      results.push({ name, dir: fullPath });
      results.push(...scanPages(fullPath, name));
    } else {
      const name = basePath ? `${basePath}/${entry.name}` : entry.name;
      results.push(...scanPages(fullPath, name));
    }
  }
  return results;
};
