import path from 'node:path';
import { ROOT } from '@constants';

export const resolveRoot = (...args: string[]): string =>
  path.resolve(ROOT, ...args);
