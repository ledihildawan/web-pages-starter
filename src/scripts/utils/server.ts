import fs from 'node:fs';
import type { JsonData } from '@/types/common';
import { readJson5File } from './parse-json5';

/**
 * Read a JSON5 or JSON file and return the parsed data.
 * Falls back to .json if .json5 doesn't exist.
 * Returns empty object if file not found or on error.
 */
export const readJSON5 = (filePath: string): JsonData => {
  try {
    let finalPath = filePath;
    if (!fs.existsSync(finalPath)) {
      finalPath = filePath.replace(/\.json5$/, '.json');
      if (!fs.existsSync(finalPath)) return {};
    }
    return readJson5File(finalPath) as JsonData;
  } catch (err) {
    console.warn(`[JSON5 Read Error]: ${filePath}`, err);
    return {};
  }
};

/**
 * Load global data from src/data directory.
 * Merges data from all JSON/JSON5 files.
 */
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

/**
 * Get component locales for selected components.
 */
export const loadSelectedComponentLocales = (
  lang: string,
  selected: string[],
  localesDir: string,
): JsonData => {
  const compData: JsonData = {};
  for (const name of selected) {
    const data = readJSON5(`${localesDir}/${lang}/components/${name}.json5`);
    if (Object.keys(data).length > 0) {
      compData[name] = data;
    }
  }
  return compData;
};
