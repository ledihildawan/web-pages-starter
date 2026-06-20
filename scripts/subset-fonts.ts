import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { lookup } from '@generated/paths';
import { log, logBox } from './lib/logger';

const FONTS_DIRS = [lookup('@dist', 'assets', 'fonts')];

const SUBSET_FLAGS_ARRAY = [
  '--flavor=woff2',
  '--no-hinting',
  '--desubroutinize',
  '--drop-tables+=DSIG',
  '--drop-tables+=MVAR',
  '--drop-tables+=cvar',
  '--drop-tables+=kern',
  '--layout-features=*',
];

function subsetFont(filePath: string): { before: number; after: number } {
  const before = fs.statSync(filePath).size;
  const tmpOut = `${filePath}.subset.tmp`;

  try {
    const escapedPath = filePath.replace(/"/g, '\\"');
    const escapedTmpOut = tmpOut.replace(/"/g, '\\"');
    const flags = SUBSET_FLAGS_ARRAY.join(' ');
    const cmd = `pyftsubset "${escapedPath}" ${flags} --output-file="${escapedTmpOut}" --unicodes=*`;
    execSync(cmd, {
      stdio: 'ignore',
      timeout: 30000,
    });

    if (fs.existsSync(tmpOut)) {
      const after = fs.statSync(tmpOut).size;
      if (after < before) {
        fs.renameSync(tmpOut, filePath);
      } else {
        fs.unlinkSync(tmpOut);
      }
      return { before, after: Math.min(after, before) };
    }
  } catch {
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }

  return { before, after: before };
}

function findWoff2Files(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findWoff2Files(fullPath));
    } else if (entry.name.endsWith('.woff2')) {
      results.push(fullPath);
    }
  }
  return results;
}

function main(): void {
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const dir of FONTS_DIRS) {
    const woff2Files = findWoff2Files(dir);

    for (const file of woff2Files) {
      const name = path.relative(dir, file);
      log.info(`  Subsetting ${name}...`);
      const { before, after } = subsetFont(file);
      totalBefore += before;
      totalAfter += after;
      processed++;
      const saved = before - after;
      const pct = before > 0 ? Math.round((saved / before) * 100) : 0;
      log.success(`  ${name}: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB (-${pct}%)`);
    }
  }

  if (processed === 0) {
    log.warn('No woff2 files found');
    return;
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;

  logBox('Subset Fonts', {
    Files: String(processed),
    Before: `${Math.round(totalBefore / 1024)} KB`,
    After: `${Math.round(totalAfter / 1024)} KB`,
    Saved: `${Math.round(totalSaved / 1024)} KB (-${totalPct}%)`,
  });
}

main();
