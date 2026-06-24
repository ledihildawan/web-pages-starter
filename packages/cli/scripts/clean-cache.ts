import fs from 'node:fs';
import { join, relative } from 'pathe';
import { log } from '@web-pages-starter/core/logger';
import { lookup } from '@generated/paths';

function getDirSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }
  return size;
}

const dirs = [
  lookup('@', 'temp/pipeline'),
  lookup('@', 'node_modules/.cache/rsbuild'),
  lookup('@dist'),
  lookup('@public', 'assets'),
];

const files = [lookup('@public', '.preview-url.json')];

let totalFreed = 0;
let cleanedCount = 0;

for (const dir of dirs) {
  try {
    if (fs.existsSync(dir)) {
      const size = getDirSize(dir);
      fs.rmSync(dir, { recursive: true, force: true });
      const relPath = relative(process.cwd(), dir);
      if (size > 0) {
        const sizeStr = size > 1024 * 1024 ? `${Math.round(size / 1024 / 1024)} MB` : `${Math.round(size / 1024)} KB`;
        log.info(`  ✓ Removed: ${relPath} (${sizeStr})`);
        totalFreed += size;
      } else {
        log.info(`  ✓ Removed: ${relPath}`);
      }
      cleanedCount++;
    }
  } catch {
    log.warn(`  ✗ Could not remove: ${relative(process.cwd(), dir)}`);
  }
}

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      const size = fs.statSync(file).size;
      fs.unlinkSync(file);
      const relPath = relative(process.cwd(), file);
      const sizeStr = size > 1024 ? `${Math.round(size / 1024)} KB` : `${size} B`;
      log.info(`  ✓ Removed: ${relPath} (${sizeStr})`);
      totalFreed += size;
      cleanedCount++;
    }
  } catch {
    log.warn(`  ✗ Could not remove: ${relative(process.cwd(), file)}`);
  }
}

if (cleanedCount === 0) {
  log.info('  No caches found - nothing to clean');
} else {
  const totalStr =
    totalFreed > 1024 * 1024 ? `${Math.round(totalFreed / 1024 / 1024)} MB` : `${Math.round(totalFreed / 1024)} KB`;
  log.success(`Done: Cleaned ${cleanedCount} item(s), freed ${totalStr}`);
}
