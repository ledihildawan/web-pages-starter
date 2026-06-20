import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { log, logBox } from './lib/logger';
import { PIPELINE_STEPS } from './lib/pipeline';

const args = process.argv.slice(2);
const isPreview = env.BUILD_PREVIEW;
const callerSiteUrl = env.SITE_URL;

const spawnEnv: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production', STAGE: 'prod' };

if (isPreview) {
  spawnEnv.BUILD_PREVIEW = 'true';
  spawnEnv.BASE_PATH = '/';
  spawnEnv.SITE_URL = callerSiteUrl || `http://localhost:${String(env.PORT)}`;
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

const runStep = (step: string): boolean => {
  const stepPath = lookup('@', step);
  const result = spawnSync('bun', [stepPath], {
    stdio: 'inherit',
    env: spawnEnv,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    log.error(`Error: ${path.basename(step)} failed — exit code ${result.status}`);
    return false;
  }
  return true;
};

logBox('Build Process', { Mode: mode });

const distPath = lookup('@dist');
if (fs.existsSync(distPath)) {
  log.info('Cleaning previous build...');
  fs.rmSync(distPath, { recursive: true, force: true });
}

log.info('\n--- Pre-build generators ---\n');
for (const step of PIPELINE_STEPS.PRE_BUILD) {
  if (!runStep(step)) process.exit(1);
}

log.info('\n--- Serve generators ---\n');
for (const step of PIPELINE_STEPS.SERVE) {
  if (!runStep(step)) process.exit(1);
}

log.info('\nBundling with Rsbuild...\n');
const rsbuildBin = path.resolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
const runtimes = [env.RSBUILD_RUNTIME, env.NODE_BINARY, 'node', 'bun'].filter(Boolean) as string[];

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

log.info('\n--- Post-build ---\n');
for (const step of PIPELINE_STEPS.POST_BUILD) {
  if (!runStep(step)) process.exit(1);
}

log.info('\n--- Copying i18n assets ---');
const i18nSrc = lookup('@public', 'assets/i18n');
const i18nDest = lookup('@dist', 'assets/i18n');
if (fs.existsSync(i18nSrc)) {
  if (fs.existsSync(i18nDest)) {
    fs.rmSync(i18nDest, { recursive: true, force: true });
  }
  fs.cpSync(i18nSrc, i18nDest, { recursive: true });
  const count = fs
    .readdirSync(i18nDest, { recursive: true })
    .filter((f): f is string => typeof f === 'string' && !fs.statSync(path.join(i18nDest, f)).isDirectory()).length;
  log.info(`  Copied ${count} i18n file(s) to dist`);
}

log.info('\n┌──────────────────────────────────────────┐');
log.info('│           Build completed                │');
log.info('├──────────────────────────────────────────┤');
log.info('│  Run `bun run preview` for tunnel access │');
log.info('└──────────────────────────────────────────┘\n');
