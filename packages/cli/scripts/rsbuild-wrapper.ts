import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'pathe';
import { ASSET_PATHS } from '@web-pages-starter/core/asset-paths';
import { computeStringHash } from '@web-pages-starter/core/pipeline-cache';
import { lookup } from '@generated/paths';
import { html as beautifyHtml } from 'js-beautify';
import * as lightningcss from 'lightningcss';

const RSBUILD_OUT = resolve(process.cwd(), 'rsbuild-out');
const DIST = lookup('@dist');
const MARKER_FILE = lookup('@', 'temp/pipeline/rsbuild-marker.json');
const COMPRESS_STEP = lookup('@cli', 'generators/compress.ts');

const isPrettyHtml = process.env.PRETTY_HTML === 'true';

const SOURCE_DIRS = ['pages', 'shared', 'layouts', 'locales', 'assets', 'data', 'features', 'configs', 'public'];

interface Marker {
  sourceHash: string;
  timestamp: number;
}

const CHUNK_NAMES = {
  alpineCore: 'chunk-alpine-core',
  alpinePlugins: 'chunk-alpine-plugins',
  i18next: 'chunk-i18next',
  i18nFormatters: 'chunk-i18n-formatters',
} as const;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function computeSourceHash(): string {
  const allFiles: string[] = [];
  const root = process.cwd();

  for (const dir of SOURCE_DIRS) {
    const dirPath = join(root, dir);
    if (fs.existsSync(dirPath)) {
      allFiles.push(...walk(dirPath));
    }
  }

  const hashes: string[] = [];
  for (const file of allFiles.sort()) {
    const relPath = relative(root, file).replace(/\\/g, '/');
    const stat = fs.statSync(file);
    hashes.push(`${relPath}:${stat.mtimeMs}:${stat.size}`);
  }
  return computeStringHash(hashes.join('|'));
}

function loadMarker(): Marker | null {
  try {
    if (!fs.existsSync(MARKER_FILE)) return null;
    return JSON.parse(fs.readFileSync(MARKER_FILE, 'utf-8')) as Marker;
  } catch {
    return null;
  }
}

function saveMarker(sourceHash: string): void {
  const marker: Marker = { sourceHash, timestamp: Date.now() };
  fs.mkdirSync(dirname(MARKER_FILE), { recursive: true });
  fs.writeFileSync(MARKER_FILE, JSON.stringify(marker, null, 2));
}

function runRsbuild(): boolean {
  const rsbuildBin = resolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
  const result = spawnSync('bun', [rsbuildBin, 'build'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
    cwd: process.cwd(),
  });
  return result.status === 0;
}

function copyToDist(): void {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.cpSync(RSBUILD_OUT, DIST, { recursive: true });
}

function rootPageAsIndex(): void {
  const src = join(DIST, 'home.html');
  const dest = join(DIST, 'index.html');
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
}

function prettyHtml(): void {
  if (!isPrettyHtml) return;

  for (const file of fs.readdirSync(DIST)) {
    if (!file.endsWith('.html')) continue;
    const filePath = join(DIST, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const beautified = beautifyHtml(content, {
      indent_size: 2,
      indent_inner_html: true,
      preserve_newlines: false,
      end_with_newline: true,
      unformatted: ['script', 'style', 'pre', 'code', 'textarea', 'span'],
    });
    fs.writeFileSync(filePath, beautified);
  }
}
function inlineCssOnDist(): void {
  if (isPrettyHtml) {
    console.log('  [inline-css] SKIPPED — pretty mode keeps CSS external');
    return;
  }

  let inlined = 0;

  for (const file of fs.readdirSync(DIST)) {
    if (!file.endsWith('.html')) continue;
    const filePath = join(DIST, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    const nonceMatch = html.match(/nonce-([a-zA-Z0-9_-]+)/);
    if (!nonceMatch) continue;
    const nonce = nonceMatch[1];

    const linkMatches = [...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*>/g)];
    let modified = false;

    for (const m of linkMatches) {
      const tag = m[0];
      const hrefMatch = tag.match(/href="([^"]+)"/);
      if (!hrefMatch) continue;

      const href = hrefMatch[1];
      if (href.startsWith('http')) continue;

      const cssPath = join(DIST, href.replace(/^\//, ''));
      if (!fs.existsSync(cssPath)) continue;

      let css = fs.readFileSync(cssPath, 'utf-8');
      const cssDir = href.substring(0, href.lastIndexOf('/'));
      css = css.replace(/(?:src:\s*)?url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g, (match, url: string) => {
        if (url.startsWith('/') || url.startsWith('http') || url.startsWith('data:')) return match;
        const newUrl = `url(${cssDir}/${url.replace(/^\.\//, '')})`;
        return match.startsWith('src:') ? `src: ${newUrl}` : newUrl;
      });

      if (!cssPath.includes('fonts.css')) {
        const minified = lightningcss.transform({
          code: Buffer.from(css),
          filename: basename(cssPath),
          minify: true,
        });
        css = minified.code.toString();
      }

      html = html.replace(tag, `<style nonce="${nonce}">${css}</style>`);
      modified = true;
      inlined++;
    }

    if (modified) {
      fs.writeFileSync(filePath, html);
    }
  }

  if (inlined > 0) {
    console.log(`  [inline-css] Inlined ${inlined} stylesheet(s) into HTML`);
  }
}

function preloadChunksOnDist(): void {
  const chunkUrls: string[] = [];
  for (const sub of ['', 'async']) {
    const dir = join(DIST, 'assets', 'scripts', sub);
    if (!fs.existsSync(dir)) continue;
    const prefix = sub ? `/${ASSET_PATHS.scripts}/async` : `/${ASSET_PATHS.scripts}`;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.js') && Object.values(CHUNK_NAMES).some((n) => f.startsWith(n))) {
        chunkUrls.push(`${prefix}/${f}`);
      }
    }
  }

  if (!chunkUrls.length) return;

  for (const file of fs.readdirSync(DIST)) {
    if (!file.endsWith('.html')) continue;
    const filePath = join(DIST, file);
    let html = fs.readFileSync(filePath, 'utf-8');
    const deferSrcs = new Set([...html.matchAll(/<script\s+defer\s+[^>]*src="([^"]*)"/g)].map((m) => m[1]));
    const preloads = chunkUrls
      .filter((url) => !deferSrcs.has(url))
      .map((url) => `<link rel="preload" as="script" href="${url}">`)
      .join('\n');
    if (preloads) {
      html = html.replace('</title>', `</title>\n${preloads}`);
      fs.writeFileSync(filePath, html);
    }
  }
}

function runCompress(): boolean {
  const result = spawnSync('bun', [COMPRESS_STEP], {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
  return result.status === 0;
}

function main(): void {
  const isForce = process.env.FORCE_REBUILD === 'true';

  console.log('[rsbuild-wrapper] Computing source hash...');
  const currentHash = computeSourceHash();
  const marker = loadMarker();

  if (!isForce && marker && marker.sourceHash === currentHash && fs.existsSync(DIST)) {
    process.exit(0);
  }

  if (isForce) {
    console.log('[rsbuild-wrapper] FORCE - rebuilding regardless of cache');
  }

  console.log('[rsbuild-wrapper] Running Rsbuild...');

  if (!runRsbuild()) {
    console.error('[rsbuild-wrapper] Rsbuild failed');
    process.exit(1);
  }

  copyToDist();
  rootPageAsIndex();
  prettyHtml();
  inlineCssOnDist();
  preloadChunksOnDist();

  if (!runCompress()) {
    console.error('[rsbuild-wrapper] Compress failed');
    process.exit(1);
  }

  saveMarker(currentHash);
  console.log('[rsbuild-wrapper] Done');
}

main();
