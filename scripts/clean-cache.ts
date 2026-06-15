import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '@constants';
import { log } from './lib/logger';

const dirs = ['node_modules/.cache', '.cache', 'dist'];
for (const dir of dirs) {
  const fullPath = path.join(ROOT, dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch {
    log.warn(`Warning: Could not remove ${fullPath}`);
  }
}

log.success('Done: Cache cleaned');
