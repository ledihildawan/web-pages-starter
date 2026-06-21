import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PIPELINE_DIR = 'temp/pipeline';
const MANIFEST_FILE = path.join(PIPELINE_DIR, 'cache-manifest.json');

interface CacheEntry {
  cachedAt: string;
  cachePath: string;
  hash?: string;
}

interface CacheManifest {
  [key: string]: CacheEntry | { cachedAt: string; ttlMinutes: number };
}

function ensurePipelineDir(): void {
  if (!existsSync(PIPELINE_DIR)) {
    mkdirSync(PIPELINE_DIR, { recursive: true });
  }
}

export function computeHash(files: string[]): string {
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    if (!existsSync(file)) continue;
    try {
      const stat = statSync(file);
      if (stat.isDirectory()) {
        const dirHash = computeHash(readdirSync(file).map((f) => path.join(file, f)));
        hash.update(dirHash);
      } else {
        hash.update(file);
        hash.update(stat.mtime.toISOString());
        const content = readFileSync(file);
        hash.update(content.slice(0, 1024));
      }
    } catch {}
  }
  return hash.digest('hex').slice(0, 16);
}

export function computeStringHash(str: string): string {
  return createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function loadManifest(): CacheManifest {
  ensurePipelineDir();
  if (!existsSync(MANIFEST_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8')) as CacheManifest;
  } catch {
    return {};
  }
}

function saveManifest(manifest: CacheManifest): void {
  ensurePipelineDir();
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
}

export function getCache(key: string): CacheEntry | null {
  const manifest = loadManifest();
  const entry = manifest[key];
  if (!entry || 'ttlMinutes' in entry) {
    return null;
  }
  const cachePath = path.join(PIPELINE_DIR, entry.cachePath);
  if (!existsSync(cachePath)) {
    return null;
  }
  return entry;
}

export function getCacheWithTTL(key: string): { cachedAt: string; ttlMinutes: number } | null {
  const manifest = loadManifest();
  const entry = manifest[key];
  if (!entry || !('ttlMinutes' in entry)) {
    return null;
  }

  if (!checkTTL(entry.cachedAt, entry.ttlMinutes)) {
    delete manifest[key];
    saveManifest(manifest);
    return null;
  }

  return { cachedAt: entry.cachedAt, ttlMinutes: entry.ttlMinutes };
}

export function setCache(key: string, cachePath: string, hash?: string): void {
  const manifest = loadManifest();
  manifest[key] = {
    cachedAt: new Date().toISOString(),
    cachePath,
    hash,
  };
  saveManifest(manifest);
}

export function setCacheWithTTL(key: string, ttlMinutes: number): void {
  const manifest = loadManifest();
  manifest[key] = {
    cachedAt: new Date().toISOString(),
    ttlMinutes,
  };
  saveManifest(manifest);
}

export function isCacheValid(key: string, hash: string): boolean {
  const entry = getCache(key);
  if (!entry || entry.hash !== hash) {
    return false;
  }
  return existsSync(path.join(PIPELINE_DIR, entry.cachePath));
}

export function checkTTL(cachedAt: string, ttlMinutes: number): boolean {
  const cachedTime = new Date(cachedAt).getTime();
  const ttlMs = ttlMinutes * 60 * 1000;
  return Date.now() - cachedTime < ttlMs;
}

export function invalidateCache(key?: string): void {
  let manifest = loadManifest();
  if (key) {
    const entry = manifest[key];
    if (entry && !('ttlMinutes' in entry)) {
      const cachePath = path.join(PIPELINE_DIR, entry.cachePath);
      if (existsSync(cachePath)) {
        rmSync(cachePath, { recursive: true, force: true });
      }
    }
    delete manifest[key];
  } else {
    for (const entry of Object.values(manifest)) {
      if (!('ttlMinutes' in entry)) {
        const cachePath = path.join(PIPELINE_DIR, entry.cachePath);
        if (existsSync(cachePath)) {
          rmSync(cachePath, { recursive: true, force: true });
        }
      }
    }
    manifest = {};
  }
  saveManifest(manifest);
}

export function storeCache(key: string, sourcePath: string, hash: string): boolean {
  const cacheDir = path.join(PIPELINE_DIR, key);

  try {
    if (existsSync(cacheDir)) {
      rmSync(cacheDir, { recursive: true, force: true });
    }
    mkdirSync(cacheDir, { recursive: true });

    if (statSync(sourcePath).isDirectory()) {
      copyDir(sourcePath, cacheDir);
    } else {
      mkdirSync(path.dirname(cacheDir), { recursive: true });
      const content = readFileSync(sourcePath);
      writeFileSync(cacheDir, content);
    }

    setCache(key, key, hash);
    return true;
  } catch {
    return false;
  }
}

export function restoreCache(key: string, destPath: string): boolean {
  const entry = getCache(key);
  if (!entry) {
    return false;
  }

  const cacheSrc = path.join(PIPELINE_DIR, entry.cachePath);
  if (!existsSync(cacheSrc)) {
    return false;
  }

  try {
    if (existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }

    if (statSync(cacheSrc).isDirectory()) {
      copyDir(cacheSrc, destPath);
    } else {
      mkdirSync(path.dirname(destPath), { recursive: true });
      const content = readFileSync(cacheSrc);
      writeFileSync(destPath, content);
    }
    return true;
  } catch {
    return false;
  }
}

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const content = readFileSync(srcPath);
      writeFileSync(destPath, content);
    }
  }
}

export function getCacheStats(): { total: number; entries: Array<{ key: string; size: number; cachedAt: string }> } {
  const manifest = loadManifest();
  const entries: Array<{ key: string; size: number; cachedAt: string }> = [];
  let total = 0;

  for (const [key, entry] of Object.entries(manifest)) {
    if ('ttlMinutes' in entry) continue;

    const cachePath = path.join(PIPELINE_DIR, entry.cachePath);
    if (!existsSync(cachePath)) continue;

    const size = getDirSize(cachePath);
    total += size;
    entries.push({ key, size, cachedAt: entry.cachedAt });
  }

  return { total, entries };
}

function getDirSize(dir: string): number {
  let size = 0;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += statSync(fullPath).size;
    }
  }
  return size;
}

export function clearPipelineCache(): void {
  if (existsSync(PIPELINE_DIR)) {
    rmSync(PIPELINE_DIR, { recursive: true, force: true });
  }
}
