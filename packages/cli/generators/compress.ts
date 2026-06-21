import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { log } from '@core/utils/logger';
import { lookup } from '@generated/paths';

const DIST = lookup('@dist');
const COMPRESS_EXTS = ['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt', '.webmanifest'];
const BROTLI_QUALITY = 11;

function compressFile(filePath: string): { br: number; gz: number } {
  const content = fs.readFileSync(filePath);
  const br = zlib.brotliCompressSync(content, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } });
  const gz = zlib.gzipSync(content, { level: 9 });
  fs.writeFileSync(`${filePath}.br`, br);
  fs.writeFileSync(`${filePath}.gz`, gz);
  return { br: br.length, gz: gz.length };
}

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

const files = walk(DIST).filter(
  (f) => COMPRESS_EXTS.includes(path.extname(f)) && !f.endsWith('.br') && !f.endsWith('.gz'),
);

let totalRaw = 0;
let totalBr = 0;
let totalGz = 0;

for (const file of files) {
  const stat = fs.statSync(file);
  totalRaw += stat.size;
  const { br, gz } = compressFile(file);
  totalBr += br;
  totalGz += gz;
}

log.success(
  `Compressed ${files.length} files — Brotli: ${Math.round(totalBr / 1024)} KB, Gzip: ${Math.round(totalGz / 1024)} KB (from ${Math.round(totalRaw / 1024)} KB raw)`,
);
