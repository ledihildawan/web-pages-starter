import fs from 'node:fs';
import { resolveRoot } from '@config/paths';
import { log } from './lib/logger';

const dirs = ['node_modules/.cache', '.cache', 'dist', 'public/assets/i18n', 'public/assets/images'];
for (const dir of dirs) {
  const fullPath = resolveRoot(dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch {
    log.warn(`Warning: Could not remove ${fullPath}`);
  }
}

log.success('Done: Cache cleaned');
