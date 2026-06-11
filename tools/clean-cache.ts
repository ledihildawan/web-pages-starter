import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from '../src/configs/paths';

const dirs = ['node_modules/.cache', '.cache', 'dist'];
for (const dir of dirs) {
  const fullPath = path.join(PATHS.ROOT, dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch { }
}

console.log('Cache cleaned');