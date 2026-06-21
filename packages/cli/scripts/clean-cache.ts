import fs from 'node:fs';
import { ASSET_PATHS } from '@constants';
import { log } from '@core/utils/logger';
import { lookup } from '@generated/paths';

const dirs = ['node_modules/.cache', '.cache', `public/${ASSET_PATHS.images}`];
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
