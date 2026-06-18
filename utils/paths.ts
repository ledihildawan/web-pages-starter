import fs from 'node:fs';
import path from 'node:path';
import { alias } from './alias';

export function lookup(key: string, ...parts: string[]): string {
  const base = alias[key];
  if (!base) throw new Error(`Unknown alias: ${key}`);
  return path.join(base, ...parts);
}

export function find(key: string, ...parts: string[]): string | null {
  const candidate = lookup(key, ...parts);
  return fs.existsSync(candidate) ? candidate : null;
}
