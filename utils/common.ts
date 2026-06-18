import path from 'node:path';

export const resolveRoot = (...args: string[]): string => {
  return path.resolve(process.cwd(), ...args);
};

export const getValueByPath = (obj: Record<string, any> | null | undefined, path: string): any => {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((prev: any, curr: string) => prev?.[curr], obj);
};
