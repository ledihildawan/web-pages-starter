import fs from 'node:fs';
import JSON5 from 'json5';
import type { JsonData } from '@utils/types';

export const collectKeys = (obj: unknown, prefix = ''): string[] => {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? collectKeys(value, nextKey)
        : [nextKey];
    });
};

const MAX_CACHE_SIZE = 1000;
const json5Cache = new Map<string, { mtime: number; data: JsonData }>();

export const readJSON5 = (filePath: string): JsonData => {
  if (!fs.existsSync(filePath)) return {};

  const stat = fs.statSync(filePath);
  const cached = json5Cache.get(filePath);
  if (cached && cached.mtime === stat.mtimeMs) return cached.data;

  try {
    const data = JSON5.parse(fs.readFileSync(filePath, 'utf-8')) as JsonData;
    if (json5Cache.size >= MAX_CACHE_SIZE) {
      const firstKey = json5Cache.keys().next().value;
      if (firstKey) json5Cache.delete(firstKey);
    }
    json5Cache.set(filePath, { mtime: stat.mtimeMs, data });
    return data;
  } catch (err) {
    throw new Error(`[JSON5 Parse Error]: ${filePath} — ${err}`);
  }
};

export const loadGlobalData = (dataDir: string): JsonData => {
  const globalData: JsonData = {};

  if (!fs.existsSync(dataDir)) return globalData;

  const files = fs.readdirSync(dataDir);
  for (const file of files) {
    if (file.endsWith('.json5') || file.endsWith('.json')) {
      const name = file.replace(/\.json5?$/, '');
      const data = readJSON5(`${dataDir}/${file}`);

      if (name === 'global') {
        Object.assign(globalData, data);
      } else {
        globalData[name] = data;
      }
    }
  }
  return globalData;
};
