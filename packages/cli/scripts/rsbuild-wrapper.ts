import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'pathe';
import { ASSET_PATHS } from '@constants';
import { computeStringHash } from '@core/utils/pipeline-cache';
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
    const content = fs.readFileSync(file);
    const hash = computeStringHash(content.toString('utf-8'));
    hashes.push(`${relPath}:${hash}`);
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

function removeEmptyPageJs(): void {
  const EMPTY_PATTERN = /rspackChunk.*?push\(\[\[\d+\],\{\d+:function\([^)]+\)\{[^}]+\}\}/;
  const EMPTY_PATTERN_STRICT = /rspackChunk.*?push\(\[\[\d+\],\{\d+:function\(\w+,\w+,\w+\)\{\w+\(\d+\)\}\}/;
  let removed = 0;
  let skipped = 0;

  for (const file of fs.readdirSync(DIST)) {
    if (!file.endsWith('.html')) continue;
    const htmlPath = join(DIST, file);
    let html = fs.readFileSync(htmlPath, 'utf-8');
    let modified = false;

    const scripts = [...html.matchAll(/<script\s+[^>]*src="([^"]+\.js)"[^>]*>/g)];

    for (const m of scripts) {
      const src = m[1];
      if (!src.includes('.js')) continue;

      const jsFile = src.replace(/^\//, '');
      const jsPath = join(DIST, jsFile);

      if (!fs.existsSync(jsPath)) continue;
      const content = fs.readFileSync(jsPath, 'utf-8');

      if (!EMPTY_PATTERN.test(content)) {
        skipped++;
        continue;
      }

      if (!EMPTY_PATTERN_STRICT.test(content)) {
        skipped++;
        continue;
      }

      const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`<script\\s+[^>]*src="${escapedSrc}"[^>]*>\\s*</script>`, 'g'), '');
      html = html.replace(new RegExp(`<link[^>]*modulepreload[^>]*href="${escapedSrc}"[^>]*>`, 'g'), '');
      fs.unlinkSync(jsPath);
      removed++;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(htmlPath, html);
    }
  }

  if (removed > 0) {
    console.log(`  [remove-empty-js] Removed ${removed} empty JS file(s)`);
  }
  if (skipped > 0) {
    console.log(`  [remove-empty-js] Skipped ${skipped} non-empty JS file(s)`);
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
  console.log('[rsbuild-wrapper] Computing source hash...');
  const currentHash = computeSourceHash();
  const marker = loadMarker();

  if (marker && marker.sourceHash === currentHash) {
    console.log('[rsbuild-wrapper] SKIP - source unchanged, using cached build');
    process.exit(0);
  }

  console.log('[rsbuild-wrapper] Running Rsbuild...');

  if (!runRsbuild()) {
    console.error('[rsbuild-wrapper] Rsbuild failed');
    process.exit(1);
  }

  console.log('[rsbuild-wrapper] Copying rsbuild-out to dist...');
  copyToDist();

  console.log('[rsbuild-wrapper] Applying root-page-as-index...');
  rootPageAsIndex();

  console.log('[rsbuild-wrapper] Applying pretty-html...');
  prettyHtml();

  console.log('[rsbuild-wrapper] Applying remove-empty-page-js...');
  removeEmptyPageJs();

  console.log('[rsbuild-wrapper] Applying inline-css...');
  inlineCssOnDist();

  console.log('[rsbuild-wrapper] Applying preload-chunks...');
  preloadChunksOnDist();

  console.log('[rsbuild-wrapper] Running compress...');
  if (!runCompress()) {
    console.error('[rsbuild-wrapper] Compress failed');
    process.exit(1);
  }

  saveMarker(currentHash);
  console.log('[rsbuild-wrapper] Done');
}

main();
