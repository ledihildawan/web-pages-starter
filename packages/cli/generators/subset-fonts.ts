import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { log, logBox } from '@core/utils/logger';
import { computeStringHash, isCacheValid, restoreCache, storeCache } from '@core/utils/pipeline-cache';
import { lookup } from '@generated/paths';
import { getNeededFontPackages, parseFontFaceBlocks } from '@i18n/fonts/font-css';

const CACHE_KEY = 'subset-fonts';

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

function getNeededFontFiles(pkg: string, wantedSubsets: Set<string>): Set<string> {
  const pkgDir = lookup('@', 'node_modules', pkg);
  const wghtPath = path.join(pkgDir, 'wght.css');
  const cssPath = fs.existsSync(wghtPath) ? wghtPath : path.join(pkgDir, 'index.css');

  if (!fs.existsSync(cssPath)) return new Set();

  const css = fs.readFileSync(cssPath, 'utf-8');
  const blocks = parseFontFaceBlocks(css);

  const needed = new Set<string>();
  for (const block of blocks) {
    if (wantedSubsets.has(block.subset)) {
      const fileName = block.css.match(/url\(\.\/files\/([^)]+)\)/)?.[1];
      if (fileName) needed.add(fileName);
    }
  }
  return needed;
}

function collectSourceFileInfos(
  packages: Map<string, any>,
  neededFiles: Map<string, Set<string>>,
): Array<{ path: string; mtime: number; size: number }> {
  const fileInfos: Array<{ path: string; mtime: number; size: number }> = [];

  for (const [pkg] of packages) {
    const files = neededFiles.get(pkg);
    if (!files) continue;

    const pkgDir = lookup('@', 'node_modules', pkg, 'files');
    for (const fileName of files) {
      const filePath = path.join(pkgDir, fileName);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        fileInfos.push({ path: filePath, mtime: stat.mtimeMs, size: stat.size });
      }
    }
  }
  return fileInfos;
}

function subsetFont(srcPath: string, destPath: string): { before: number; after: number } {
  const before = fs.statSync(srcPath).size;
  const tmpOut = `${destPath}.subset.tmp`;

  try {
    const escapedSrc = srcPath.replace(/"/g, '\\"');
    const escapedTmpOut = tmpOut.replace(/"/g, '\\"');
    const flags = SUBSET_FLAGS_ARRAY.join(' ');
    const cmd = `pyftsubset "${escapedSrc}" ${flags} --output-file="${escapedTmpOut}" --unicodes=*`;
    execSync(cmd, {
      stdio: 'ignore',
      timeout: 30000,
    });

    if (fs.existsSync(tmpOut)) {
      const after = fs.statSync(tmpOut).size;
      if (after < before) {
        fs.renameSync(tmpOut, destPath);
      } else {
        fs.unlinkSync(tmpOut);
      }
      return { before, after: Math.min(after, before) };
    }
  } catch (_err) {
    if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    console.warn(`⚠ Font subset timeout/failure: ${path.basename(srcPath)}`);
  }

  return { before, after: before };
}

function main(): void {
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force') || args.includes('-f');

  const allLocales = [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])];
  const fontPackages = getNeededFontPackages(allLocales as any);

  const neededFiles = new Map<string, Set<string>>();
  for (const [pkg, entries] of fontPackages) {
    const wantAll = entries.some((e: any) => e.subsets === 'all');
    const wantedSubsets = new Set<string>();
    if (!wantAll) {
      for (const entry of entries) {
        if (entry.subsets !== 'all') {
          for (const s of entry.subsets) wantedSubsets.add(s);
        }
      }
    }
    neededFiles.set(pkg, getNeededFontFiles(pkg, wantedSubsets));
  }

  const fileInfos = collectSourceFileInfos(fontPackages, neededFiles);
  const sourceHash = computeStringHash(JSON.stringify(fileInfos));
  const publicFontsDir = lookup('@public', 'assets', 'fonts');

  if (!forceRefresh && isCacheValid(CACHE_KEY, sourceHash)) {
    const pkgNames = [...fontPackages.keys()].map((p) => p.replace('@', '').replace('/', '-')).join(', ');
    logBox('Subset Fonts', { Status: 'Using cached subsetted fonts', Packages: pkgNames });
    if (!restoreCache(CACHE_KEY, publicFontsDir)) {
      log.warn('Cache restore failed, will regenerate');
    }
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const [pkg] of fontPackages) {
    const files = neededFiles.get(pkg);
    if (!files || files.size === 0) continue;

    const pkgDir = lookup('@', 'node_modules', pkg);
    const pkgName = pkg.replace('@', '').replace('/', '-');

    for (const fileName of files) {
      const srcFile = path.join(pkgDir, 'files', fileName);
      const destFile = path.join(publicFontsDir, pkgName, 'files', fileName);

      const destFileDir = path.dirname(destFile);
      if (!fs.existsSync(destFileDir)) {
        fs.mkdirSync(destFileDir, { recursive: true });
      }

      const name = `${pkgName}/files/${fileName}`;
      log.info(`  Subsetting ${name}...`);
      const { before, after } = subsetFont(srcFile, destFile);
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

  if (!storeCache(CACHE_KEY, publicFontsDir, sourceHash)) {
    log.warn('Failed to store cache for subset fonts');
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;
  const pkgNames = [...fontPackages.keys()].map((p) => p.replace('@', '').replace('/', '-')).join(', ');

  logBox('Subset Fonts', {
    Packages: pkgNames,
    Files: String(processed),
    Before: `${Math.round(totalBefore / 1024)} KB`,
    After: `${Math.round(totalAfter / 1024)} KB`,
    Saved: `${Math.round(totalSaved / 1024)} KB (-${totalPct}%)`,
  });
}

main();
