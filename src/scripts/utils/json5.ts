import fs from 'node:fs';
import type { JsonData } from '@/types/common';

const stripJson5Syntax = (source: string): string => {
  let output = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      if (escaped) {
        output += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        output += char;
        escaped = true;
        continue;
      }

      if (char === quote) {
        output += quote === "'" ? '"' : char;
        quote = null;
        continue;
      }

      output += quote === "'" && char === '"' ? '\\"' : char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      output += char === "'" ? '"' : char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      ) {
        if (source[index] === '\n') output += '\n';
        index += 1;
      }
      index += 1;
      continue;
    }

    if (char === ',') {
      let lookahead = index + 1;
      while (/\s/.test(source[lookahead] ?? '')) lookahead += 1;
      if (source[lookahead] === '}' || source[lookahead] === ']') continue;
    }

    output += char;
  }

  return output;
};

export const parseJson5 = (source: string): unknown =>
  JSON.parse(stripJson5Syntax(source));

export const readJson5File = (filePath: string): unknown =>
  parseJson5(fs.readFileSync(filePath, 'utf-8'));

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
