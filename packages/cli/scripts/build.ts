import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ASSET_PATHS } from '@constants';
import { log, logBox } from '@core/utils/logger';
import { PIPELINE_STEPS } from '@core/utils/pipeline';
import { LOCALE_CODES } from '@generated/active-locales-data';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';

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

log.info('\n--- Copying locale assets ---');
const localesSrc = lookup('@locales');
const localesPublicDest = lookup('@public', ASSET_PATHS.locales);
const localesDistDest = lookup('@dist', ASSET_PATHS.locales);
const activeLocales = LOCALE_CODES;

if (fs.existsSync(localesSrc)) {
  if (fs.existsSync(localesPublicDest)) {
    fs.rmSync(localesPublicDest, { recursive: true, force: true });
  }
  for (const locale of activeLocales) {
    const srcDir = path.join(localesSrc, locale);
    const destDir = path.join(localesPublicDest, locale);
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }
    }
  }
  log.info(`  Copied ${activeLocales.length} locale(s) to public`);
}
if (fs.existsSync(localesPublicDest)) {
  if (fs.existsSync(localesDistDest)) {
    fs.rmSync(localesDistDest, { recursive: true, force: true });
  }
  fs.cpSync(localesPublicDest, localesDistDest, { recursive: true });
  const count = fs
    .readdirSync(localesDistDest, { recursive: true })
    .filter(
      (f): f is string => typeof f === 'string' && !fs.statSync(path.join(localesDistDest, f)).isDirectory(),
    ).length;
  log.info(`  Copied ${count} locale file(s) to dist`);
}

log.info('\n┌──────────────────────────────────────────┐');
log.info('│           Build completed                │');
log.info('├──────────────────────────────────────────┤');
log.info('│  Run `bun run preview` for tunnel access │');
log.info('└──────────────────────────────────────────┘\n');
