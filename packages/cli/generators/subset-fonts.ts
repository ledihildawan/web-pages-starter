import { exec } from 'node:child_process';
import fs from 'node:fs';
import { basename, dirname, join } from 'pathe';
import { i18nConfig } from '@config/i18n';
import type { LocaleCode } from '@i18n/data/locales';
import { log, logBox } from '@core/logger';
import { computeStringHash, isCacheValid, restoreCache, storeCache } from '@core/pipeline-cache';
import { lookup } from '@generated/paths';
import { getNeededFontPackages, parseFontFaceBlocks } from '@i18n/fonts/font-css';
import type { FontPackageEntry } from '@i18n/fonts/font-registry';

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

const MAX_CONCURRENCY = 4;

function getNeededFontFiles(pkg: string, wantedSubsets: Set<string>): Set<string> {
  const pkgDir = lookup('@', 'node_modules', pkg);
  const wghtPath = join(pkgDir, 'wght.css');
  const cssPath = fs.existsSync(wghtPath) ? wghtPath : join(pkgDir, 'index.css');

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
  packages: Map<string, FontPackageEntry[]>,
  neededFiles: Map<string, Set<string>>,
): Array<{ path: string; mtime: number; size: number }> {
  const fileInfos: Array<{ path: string; mtime: number; size: number }> = [];

  for (const [pkg] of packages) {
    const files = neededFiles.get(pkg);
    if (!files) continue;

    const pkgDir = lookup('@', 'node_modules', pkg, 'files');
    for (const fileName of files) {
      const filePath = join(pkgDir, fileName);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        fileInfos.push({ path: filePath, mtime: stat.mtimeMs, size: stat.size });
      }
    }
  }
  return fileInfos;
}

async function subsetFontAsync(srcPath: string, destPath: string): Promise<{ before: number; after: number }> {
  const before = fs.statSync(srcPath).size;
  const tmpOut = `${destPath}.subset.tmp`;

  try {
    const escapedSrc = srcPath.replace(/"/g, '\\"');
    const escapedTmpOut = tmpOut.replace(/"/g, '\\"');
    const flags = SUBSET_FLAGS_ARRAY.join(' ');
    const cmd = `pyftsubset "${escapedSrc}" ${flags} --output-file="${escapedTmpOut}" --unicodes=*`;

    await new Promise<void>((resolve, reject) => {
      exec(cmd, { timeout: 30000 }, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
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
    console.warn(`[font-subset] Warning: ${basename(srcPath)}`);
  }

  return { before, after: before };
}

interface FontTask {
  srcFile: string;
  destFile: string;
  name: string;
}

async function runWithConcurrency<T>(
  tasks: T[],
  concurrency: number,
  runner: (task: T) => Promise<void>,
): Promise<void> {
  const executing: Promise<void>[] = [];
  for (const task of tasks) {
    const p = runner(task).then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
}

async function mainAsync(): Promise<void> {
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force') || args.includes('-f');

  const allLocales: LocaleCode[] = [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])];
  const fontPackages = getNeededFontPackages(allLocales);

  const neededFiles = new Map<string, Set<string>>();
  for (const [pkg, entries] of fontPackages) {
    const wantAll = entries.some((e) => e.subsets === 'all');
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

  const fontTasks: FontTask[] = [];

  for (const [pkg] of fontPackages) {
    const files = neededFiles.get(pkg);
    if (!files || files.size === 0) continue;

    const pkgDir = lookup('@', 'node_modules', pkg);
    const pkgName = pkg.replace('@', '').replace('/', '-');

    for (const fileName of files) {
      const srcFile = join(pkgDir, 'files', fileName);
      const destFile = join(publicFontsDir, pkgName, 'files', fileName);

      const destFileDir = dirname(destFile);
      if (!fs.existsSync(destFileDir)) {
        fs.mkdirSync(destFileDir, { recursive: true });
      }

      const name = `${pkgName}/files/${fileName}`;
      fontTasks.push({ srcFile, destFile, name });
    }
  }

  if (fontTasks.length === 0) {
    log.warn('No woff2 files found');
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;

  await runWithConcurrency(fontTasks, MAX_CONCURRENCY, async (task) => {
    log.info(`  Subsetting ${task.name}...`);
    const result = await subsetFontAsync(task.srcFile, task.destFile);
    totalBefore += result.before;
    totalAfter += result.after;
    const saved = result.before - result.after;
    const pct = result.before > 0 ? Math.round((saved / result.before) * 100) : 0;
    log.success(
      `  ${task.name}: ${Math.round(result.before / 1024)} KB → ${Math.round(result.after / 1024)} KB (-${pct}%)`,
    );
  });

  if (!storeCache(CACHE_KEY, publicFontsDir, sourceHash)) {
    log.warn('Failed to store cache for subset fonts');
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? Math.round((totalSaved / totalBefore) * 100) : 0;
  const pkgNames = [...fontPackages.keys()].map((p) => p.replace('@', '').replace('/', '-')).join(', ');

  logBox('Subset Fonts', {
    Packages: pkgNames,
    Files: String(fontTasks.length),
    Before: `${Math.round(totalBefore / 1024)} KB`,
    After: `${Math.round(totalAfter / 1024)} KB`,
    Saved: `${Math.round(totalSaved / 1024)} KB (-${totalPct}%)`,
  });
}

mainAsync().catch(console.error);
