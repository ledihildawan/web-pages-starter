import fs from 'node:fs';
import path from 'node:path';
import { log } from '@core/utils/logger';
import { lookup } from '@generated/paths';

const dirs = [
  lookup('@', 'temp/pipeline'),
  lookup('@', 'node_modules/.cache/rsbuild'),
  lookup('@dist'),
  lookup('@public', 'assets'),
];

for (const dir of dirs) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log.info(`  Removed: ${path.relative(process.cwd(), dir)}`);
    }
  } catch {
    log.warn(`Warning: Could not remove ${dir}`);
  }
}

log.success('Done: All caches cleaned');
