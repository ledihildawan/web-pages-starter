import fs from 'node:fs';
import { relative } from 'pathe';
import { log } from '@core/logger';
import { lookup } from '@generated/paths';

const dirs = [
  lookup('@', 'temp/pipeline'),
  lookup('@', 'node_modules/.cache/rsbuild'),
  lookup('@dist'),
  lookup('@public', 'assets'),
];

const files = [lookup('@public', '.preview-url.json')];

for (const dir of dirs) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      log.info(`  Removed: ${relative(process.cwd(), dir)}`);
    }
  } catch {
    log.warn(`Warning: Could not remove ${dir}`);
  }
}

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      log.info(`  Removed: ${relative(process.cwd(), file)}`);
    }
  } catch {
    log.warn(`Warning: Could not remove ${file}`);
  }
}

log.success('Done: All caches cleaned');
