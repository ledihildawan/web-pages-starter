import '@config/env';

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { resolveRoot } from '@config/paths';
import { log, logBox } from './lib/logger';

const args = process.argv.slice(2);

const spawnEnv: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production' };

for (const key of ['SITE_URL', 'BASE_PATH', 'PORT', 'HOST', 'MINIFY', 'PRETTY_HTML', 'BUILD_PREVIEW', 'FOR_PREVIEW']) {
  delete spawnEnv[key];
}

const mode = args.includes('--debug')
  ? 'debug (no minify)'
  : args.includes('--pretty')
    ? 'production (pretty HTML)'
    : 'production';
if (args.includes('--debug')) {
  spawnEnv.MINIFY = 'false';
}
if (args.includes('--pretty')) {
  spawnEnv.PRETTY_HTML = 'true';
}

logBox('Build Process', { Mode: mode });

const distPath = resolveRoot('dist');
if (fs.existsSync(distPath)) {
  log.info('Cleaning previous build...');
  fs.rmSync(distPath, { recursive: true, force: true });
}

const generators = [
  'scripts/generate-sitemap.ts',
  'scripts/generate-manifest.ts',
  'scripts/generate-robots.ts',
  'scripts/generate-sw.ts',
];

for (const gen of generators) {
  const genPath = resolveRoot(gen);
  const result = spawnSync('bun', [genPath], {
    stdio: 'inherit',
    env: spawnEnv,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    log.error(`Error: ${path.basename(gen)} failed — exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

log.info('\nBundling with Rsbuild...\n');
const rsbuildBin = path.resolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
const runtimes = [process.env.RSBUILD_RUNTIME, process.env.NODE_BINARY, 'node', 'bun'].filter(Boolean) as string[];

let result: ReturnType<typeof spawnSync> | null = null;

for (const runtime of runtimes) {
  try {
    result = spawnSync(runtime, [rsbuildBin, 'build'], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });
  } catch {
    log.warn(`Warning: Runtime "${runtime}" unavailable, trying next...`);
    continue;
  }

  if (!result.error || result.status !== null) break;
}

if (!result) {
  log.error('Error: Build process failed — no runtime available');
  process.exit(1);
}

if (result.error) {
  log.error(`Error: Build process failed — ${result.error}`);
  process.exit(1);
}

if (result.status !== 0) {
  log.error(`Error: Build failed — exit code ${result.status}`);
  process.exit(result.status || 1);
}

log.info('\n┌──────────────────────────────────────────┐');
log.info('│           Build completed                │');
log.info('├──────────────────────────────────────────┤');
log.info('│  Run `bun run preview` for tunnel access │');
log.info('└──────────────────────────────────────────┘\n');
