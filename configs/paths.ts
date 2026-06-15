import path from 'node:path';

export const ROOT_PATH = process.cwd();

export const resolveRoot = (...args: string[]): string => {
  return path.resolve(ROOT_PATH, ...args);
};
