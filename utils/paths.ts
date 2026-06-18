import fs from 'node:fs';
import path from 'node:path';
import { type AliasKey, alias } from './alias';

export type { AliasKey };

export function lookup(key: AliasKey, ...parts: string[]): string {
  return path.join(alias[key], ...parts);
}

export function find(key: AliasKey, ...parts: string[]): string | null {
  const candidate = lookup(key, ...parts);
  return fs.existsSync(candidate) ? candidate : null;
}
