import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from '@config/paths';
import { log, logBox } from './lib/logger';

const FONTS_DIRS = [resolveRoot('public', 'assets', 'fonts'), resolveRoot('dist', 'assets', 'fonts')];

const SUBSET_FLAGS = [
  '--flavor=woff2',
  '--no-hinting',
  '--desubroutinize',
  '--drop-tables+=DSIG',
  '--drop-tables+=MVAR',
  '--drop-tables+=cvar',
  '--drop-tables+=kern',
  '--layout-features=*',
  '--output-file=__SUBSET_OUT__',
  '--unicodes=*',
].join(' ');

function subsetFont(filePath: string): { before: number; after: number } {
  const before = fs.statSync(filePath).size;
  const tmpOut = `${filePath}.tmp`;

  try {
    execSync(`pyftsubset "${filePath}" ${SUBSET_FLAGS.replace('__SUBSET_OUT__', `"${tmpOut}"`)}`, {
      stdio: 'ignore',
      timeout: 30000,
    });

    if (fs.existsSync(tmpOut)) {
      const after = fs.statSync(tmpOut).size;
      if (after < before) {
        fs.copyFileSync(tmpOut, filePath);
      }
      fs.unlinkSync(tmpOut);
      return { before, after: Math.min(after, before) };
    }
  } catch {
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  }

  return { before, after: before };
}

function main(): void {
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const dir of FONTS_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const woff2Files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.woff2'))
      .map((f) => path.join(dir, f));

    for (const file of woff2Files) {
      const name = path.basename(file);
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
