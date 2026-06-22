import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { log, logBox } from '@core/utils/logger';
import { computeStringHash } from '@core/utils/pipeline-cache';
import { lookup } from '@generated/paths';

const DIST = lookup('@dist');
const CACHE_DIR = lookup('@', 'temp/pipeline/compress');
const COMPRESS_EXTS = ['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.webmanifest'];
const BROTLI_QUALITY = 11;

const args = process.argv.slice(2);
const forceRefresh = args.includes('--force') || args.includes('-f');

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function restoreFromCache(cacheBrPath: string, cacheGzPath: string, brPath: string, gzPath: string): boolean {
  try {
    const brContent = fs.readFileSync(cacheBrPath);
    const gzContent = fs.readFileSync(cacheGzPath);
    fs.writeFileSync(brPath, brContent);
    fs.writeFileSync(gzPath, gzContent);
    return true;
  } catch {
    return false;
  }
}

const allFiles = walk(DIST);
const files = allFiles.filter(
  (f) => COMPRESS_EXTS.includes(path.extname(f)) && !f.endsWith('.br') && !f.endsWith('.gz'),
);

const relPathToHash = new Map<string, string>();

for (const file of files) {
  const relPath = path.relative(DIST, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file);
  const hash = computeStringHash(content.toString('utf-8'));
  relPathToHash.set(relPath, hash);
}

let cached = 0;
let fresh = 0;
let totalRaw = 0;
let totalBr = 0;
let totalGz = 0;

for (const file of files) {
  const relPath = path.relative(DIST, file).replace(/\\/g, '/');
  const hash = relPathToHash.get(relPath) || '';
  const cacheSubDir = path.join(CACHE_DIR, hash);
  const cacheBrPath = `${cacheSubDir}/${relPath}.br`;
  const cacheGzPath = `${cacheSubDir}/${relPath}.gz`;

  const brPath = `${file}.br`;
  const gzPath = `${file}.gz`;

  const cacheExists = fs.existsSync(cacheBrPath) && fs.existsSync(cacheGzPath);

  if (!forceRefresh && cacheExists) {
    const restored = restoreFromCache(cacheBrPath, cacheGzPath, brPath, gzPath);
    if (restored) {
      const stat = fs.statSync(file);
      totalRaw += stat.size;
      totalBr += fs.statSync(brPath).size;
      totalGz += fs.statSync(gzPath).size;
      cached++;
      continue;
    }
  }

  const content = fs.readFileSync(file);
  const br = zlib.brotliCompressSync(content, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } });
  const gz = zlib.gzipSync(content, { level: 9 });

  fs.writeFileSync(brPath, br);
  fs.writeFileSync(gzPath, gz);

  fs.mkdirSync(path.dirname(cacheBrPath), { recursive: true });
  fs.writeFileSync(cacheBrPath, br);
  fs.writeFileSync(cacheGzPath, gz);

  totalRaw += content.length;
  totalBr += br.length;
  totalGz += gz.length;
  fresh++;
}

const cacheStatus = forceRefresh ? '(forced)' : '';
logBox('Compress', {
  Files: String(files.length),
  Cached: `${cached} ${cacheStatus}`,
  Fresh: String(fresh),
  'Raw Total': `${Math.round(totalRaw / 1024)} KB`,
  Brotli: `${Math.round(totalBr / 1024)} KB`,
  Gzip: `${Math.round(totalGz / 1024)} KB`,
});
log.success(
  `Compressed ${files.length} files — Brotli: ${Math.round(totalBr / 1024)} KB, Gzip: ${Math.round(totalGz / 1024)} KB (from ${Math.round(totalRaw / 1024)} KB raw)`,
);
