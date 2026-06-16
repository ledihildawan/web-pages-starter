import fs from 'node:fs';
import path from 'node:path';
import { env } from '@config/env';
import { resolveRoot } from '@config/paths';
import { generatedHeader, writeFilePath } from '@scripts/lib/write-file';
import sharp from 'sharp';
import { log, logBox } from './lib/logger';

const SOURCE_DIR = resolveRoot('assets', 'images');
const OUTPUT_DIR = resolveRoot('public', 'assets', 'images');
const MANIFEST_FILE = resolveRoot('generated', 'image-manifest.ts');

const ASSET_PREFIX = env.BASE_PATH.replace(/\/$/, '');
const imageUrl = (file: string): string => `${ASSET_PREFIX}/assets/images/${file}`;

const SIZES = [400, 800, 1600];
const AVIF_QUALITY = 50;
const WEBP_QUALITY = 65;
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
  srcsetFallback: string;
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
    const srcsetFallbackParts: string[] = [];
    let defaultSrc = '';
    let defaultFallbackSrc = '';

    for (const size of SIZES) {
      if (size <= metadata.width) {
        const avifOut = path.join(OUTPUT_DIR, `${outputName}-${size}w.avif`);
        const webpOut = path.join(OUTPUT_DIR, `${outputName}-${size}w.webp`);
        await sharp(inputFile)
          .resize({ width: size, withoutEnlargement: true })
          .avif({ quality: AVIF_QUALITY })
          .toFile(avifOut);
        await sharp(inputFile)
          .resize({ width: size, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(webpOut);

        const avifUrl = imageUrl(`${outputName}-${size}w.avif`);
        const webpUrl = imageUrl(`${outputName}-${size}w.webp`);
        srcsetParts.push(`${avifUrl} ${size}w`);
        srcsetFallbackParts.push(`${webpUrl} ${size}w`);

        if (size === DEFAULT_SIZE || (!defaultSrc && size <= DEFAULT_SIZE)) {
          defaultSrc = avifUrl;
          defaultFallbackSrc = webpUrl;
        }
      }
    }

    if (!defaultSrc) {
      defaultSrc = srcsetParts.length > 0 ? srcsetParts[0].split(' ')[0] : '';
      defaultFallbackSrc = srcsetFallbackParts.length > 0 ? srcsetFallbackParts[0].split(' ')[0] : '';
    }

    if (srcsetParts.length === 0) {
      const avifName = `${outputName}-${metadata.width}w.avif`;
      const webpName = `${outputName}-${metadata.width}w.webp`;
      await sharp(inputFile).avif({ quality: AVIF_QUALITY }).toFile(path.join(OUTPUT_DIR, avifName));
      await sharp(inputFile).webp({ quality: WEBP_QUALITY }).toFile(path.join(OUTPUT_DIR, webpName));
      const avifUrl = imageUrl(avifName);
      const webpUrl = imageUrl(webpName);
      srcsetParts.push(`${avifUrl} ${metadata.width}w`);
      srcsetFallbackParts.push(`${webpUrl} ${metadata.width}w`);
      defaultSrc = avifUrl;
      defaultFallbackSrc = webpUrl;
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
      src: defaultFallbackSrc,
      srcset: srcsetParts.join(', '),
      srcsetFallback: srcsetFallbackParts.join(', '),
      lqip,
    };
  } catch (err) {
    log.warn(`  Skipping ${outputName}: ${(err as Error).message}`);
    return null;
  }
}

function copyPassthrough(inputFile: string, outputName: string): void {
  const outFile = path.join(OUTPUT_DIR, outputName);
  fs.copyFileSync(inputFile, outFile);
}

async function main(): Promise<void> {
  if (!fs.existsSync(SOURCE_DIR)) {
    log.warn('No assets/images/ directory found');
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const entries = fs.readdirSync(SOURCE_DIR);
  const manifest: Record<string, ImageEntry> = {};
  let processed = 0;
  let passthrough = 0;

  for (const entry of entries) {
    const inputPath = path.join(SOURCE_DIR, entry);
    if (!fs.statSync(inputPath).isFile()) continue;

    const ext = path.extname(entry).toLowerCase();
    const name = path.basename(entry, ext);

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

  const manifestContent = `${generatedHeader('scripts/generate-images.ts')}

export interface ImageEntry {
  width: number;
  height: number;
  src: string;
  srcset: string;
  srcsetFallback: string;
  lqip: string;
}

export const IMAGE_MANIFEST: Record<string, ImageEntry> = ${JSON.stringify(manifest, null, 2)};
`;

  writeFilePath(MANIFEST_FILE, manifestContent);

  logBox('Generate Images', {
    Processed: String(processed),
    Passthrough: String(passthrough),
    Sizes: SIZES.join(', '),
    Output: 'public/assets/images/',
  });
}

await main();
