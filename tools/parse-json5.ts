import fs from 'node:fs';

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
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
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
