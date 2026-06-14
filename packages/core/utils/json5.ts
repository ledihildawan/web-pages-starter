import fs from 'node:fs';
import JSON5 from 'json5';
import type { JsonData } from './types';

export const collectKeys = (obj: unknown, prefix = ''): string[] => {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
        ? collectKeys(value, nextKey)
        : [nextKey];
    });
};

export const readJSON5 = (filePath: string): JsonData => {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON5.parse(fs.readFileSync(filePath, 'utf-8')) as JsonData;
  } catch (err) {
    console.warn(`[JSON5 Read Error]: ${filePath}`, err);
    return {};
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
