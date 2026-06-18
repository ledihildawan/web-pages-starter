import fs from 'node:fs';
import path from 'node:path';
import { type AliasKey, aliasPaths } from '../generated/path-aliases';

export type { AliasKey };

export const alias = Object.fromEntries(Object.entries(aliasPaths).map(([k, v]) => [k, path.resolve(v)])) as Record<
  AliasKey,
  string
>;

export function lookup(key: AliasKey, ...parts: string[]): string {
  return path.join(alias[key], ...parts);
}

export function find(key: AliasKey, ...parts: string[]): string | null {
  const candidate = lookup(key, ...parts);
  return fs.existsSync(candidate) ? candidate : null;
}
