import fs from 'node:fs';
import { lookup } from '@generated/paths';
import { log } from './lib/logger';

const dirs = ['node_modules/.cache', '.cache', 'public/assets/images'];
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
