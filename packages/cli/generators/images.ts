import fs from 'node:fs';
import { basename, extname, join } from 'pathe';
import { ASSET_PATHS } from '@constants';
import { log, logBox } from '@core/utils/logger';
import { computeStringHash, isCacheValid, restoreCache, storeCache } from '@core/utils/pipeline-cache';
import { generatedHeader, writeFilePath } from '@core/utils/write-file';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import sharp from 'sharp';

const SOURCE_DIR = lookup('@assets', 'images');
const OUTPUT_DIR = lookup('@public', 'assets', 'images');
const MANIFEST_FILE = lookup('@generated', 'image-manifest.ts');
const CACHE_KEY = 'images';

const args = process.argv.slice(2);
const forceRefresh = args.includes('--force') || args.includes('-f');

const ASSET_PREFIX = env.BASE_PATH.replace(/\/$/, '');
const imageUrl = (file: string): string => `${ASSET_PREFIX}/${ASSET_PATHS.images}/${file}`;

const SIZES = [400, 800, 1600];
const AVIF_QUALITY = 50;
const LQIP_WIDTH = 20;
const LQIP_BLUR = 5;
const LQIP_QUALITY = 20;
const DEFAULT_SIZE = 800;

const RASTER_EXTS = ['.avif', '.webp', '.jpg', '.jpeg', '.png'];
const PASSTHROUGH_EXTS = ['.svg', '.gif', '.ico'];

interface ImageEntry {
  width: number;
  height: number;
  src: string;
  srcset: string;
  lqip: string;
}

async function processImage(inputFile: string, outputName: string): Promise<ImageEntry | null> {
  try {
    const image = sharp(inputFile);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      log.warn(`  Skipping ${outputName}: could not read dimensions`);
      return null;
    }

    const srcsetParts: string[] = [];
    let defaultSrc = '';

    for (const size of SIZES) {
      if (size <= metadata.width) {
        const outFile = join(OUTPUT_DIR, `${outputName}-${size}w.avif`);
        await sharp(inputFile)
          .resize({ width: size, withoutEnlargement: true })
          .avif({ quality: AVIF_QUALITY })
          .toFile(outFile);

        const url = imageUrl(`${outputName}-${size}w.avif`);
        srcsetParts.push(`${url} ${size}w`);

        if (size === DEFAULT_SIZE || (!defaultSrc && size <= DEFAULT_SIZE)) {
          defaultSrc = url;
        }
      }
    }

    if (!defaultSrc) {
      defaultSrc = srcsetParts.length > 0 ? srcsetParts[0].split(' ')[0] : '';
    }

    if (srcsetParts.length === 0) {
      const outName = `${outputName}-${metadata.width}w.avif`;
      await sharp(inputFile).avif({ quality: AVIF_QUALITY }).toFile(join(OUTPUT_DIR, outName));
      const url = imageUrl(outName);
      srcsetParts.push(`${url} ${metadata.width}w`);
      defaultSrc = url;
    }

    const lqipBuffer = await sharp(inputFile)
      .resize({ width: LQIP_WIDTH })
      .blur(LQIP_BLUR)
      .jpeg({ quality: LQIP_QUALITY })
      .toBuffer();

    const lqip = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;

    return {
      width: metadata.width,
      height: metadata.height,
      src: defaultSrc,
      srcset: srcsetParts.join(', '),
      lqip,
    };
  } catch (err) {
    log.warn(`  Skipping ${outputName}: ${(err as Error).message}`);
    return null;
  }
}

function copyPassthrough(inputFile: string, outputName: string): void {
  const outFile = join(OUTPUT_DIR, outputName);
  fs.copyFileSync(inputFile, outFile);
}

function computeSourceHash(): string {
  if (!fs.existsSync(SOURCE_DIR)) {
    return '';
  }
  const entries = fs.readdirSync(SOURCE_DIR);
  const fileInfos: Array<{ name: string; mtime: number }> = [];
  for (const entry of entries) {
    const inputPath = join(SOURCE_DIR, entry);
    if (fs.statSync(inputPath).isFile()) {
      const stat = fs.statSync(inputPath);
      fileInfos.push({ name: entry, mtime: stat.mtimeMs });
    }
  }
  return computeStringHash(JSON.stringify(fileInfos));
}

async function main(): Promise<void> {
  if (!fs.existsSync(SOURCE_DIR)) {
    log.warn(`No ${ASSET_PATHS.images}/ directory found`);
    return;
  }

  const sourceHash = computeSourceHash();

  if (!forceRefresh && isCacheValid(CACHE_KEY, sourceHash)) {
    if (fs.existsSync(OUTPUT_DIR)) {
      if (restoreCache(CACHE_KEY, OUTPUT_DIR)) {
        logBox('Generate Images', {
          Processed: '(cached)',
          Passthrough: '(cached)',
          Sizes: SIZES.join(', '),
          Output: `public/${ASSET_PATHS.images}/`,
        });
        log.success('Done: Using cached images');
        process.exit(0);
      }
      log.warn('Cache restore failed, regenerating');
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = fs.readdirSync(SOURCE_DIR);
  const manifest: Record<string, ImageEntry> = {};
  let processed = 0;
  let passthrough = 0;

  for (const entry of entries) {
    const inputPath = join(SOURCE_DIR, entry);
    if (!fs.statSync(inputPath).isFile()) continue;

    const ext = extname(entry).toLowerCase();
    const name = basename(entry, ext);

    if (PASSTHROUGH_EXTS.includes(ext)) {
      copyPassthrough(inputPath, entry);
      passthrough++;
      continue;
    }

    if (!RASTER_EXTS.includes(ext)) {
      continue;
    }

    log.info(`  Processing ${entry}...`);
    const result = await processImage(inputPath, name);
    if (result) {
      manifest[name] = result;
      processed++;
    }
  }

  const manifestContent = `${generatedHeader('packages/cli/generators/images.ts', {
    description: [`Images processed: ${processed}`, `Passthrough: ${passthrough}`, `Sizes: ${SIZES.join(', ')}px`].join(
      '\n',
    ),
  })}

export interface ImageEntry {
  width: number;
  height: number;
  src: string;
  srcset: string;
  lqip: string;
}

export const IMAGE_MANIFEST: Record<string, ImageEntry> = ${JSON.stringify(manifest, null, 2)};
`;

  writeFilePath(MANIFEST_FILE, manifestContent);

  if (!storeCache(CACHE_KEY, OUTPUT_DIR, sourceHash)) {
    log.warn('Failed to store cache for images');
  }

  logBox('Generate Images', {
    Processed: String(processed),
    Passthrough: String(passthrough),
    Sizes: SIZES.join(', '),
    Output: `public/${ASSET_PATHS.images}/`,
  });
}

await main();
