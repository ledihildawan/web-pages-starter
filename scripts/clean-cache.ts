import fs from 'node:fs';
import { lookup } from '@generated/paths';
import { log } from './lib/logger';

const dirs = [
  'node_modules/.cache',
  '.cache',
  'dist',
  'public/assets/i18n',
  'public/assets/images',
  'public/assets/fonts',
];
for (const dir of dirs) {
  const fullPath = lookup('@', dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch {
    log.warn(`Warning: Could not remove ${fullPath}`);
  }
}

log.success('Done: Cache cleaned');
