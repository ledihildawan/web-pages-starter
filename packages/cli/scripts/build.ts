import { spawnSync } from 'node:child_process';
import { basename } from 'pathe';
import process from 'node:process';
import { log, logBox } from '@web-pages-starter/core/logger';
import { PIPELINE_STEPS } from '@web-pages-starter/core/pipeline';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import {
  readDevCache,
  writeDevCache,
  getSourcesForStep,
  getSourcesMtime,
  hasSourcesChanged,
  createStepCache,
} from '@web-pages-starter/core/pipeline-cache';

const BUILD_CACHE_PREFIX = 'build-';

const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isPreview = env.BUILD_PREVIEW;
const callerSiteUrl = env.SITE_URL;

const spawnEnv: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: 'production',
  STAGE: 'prod',
  FORCE_REBUILD: isForce ? 'true' : undefined,
};

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

const runPipelineWithCache = (steps: readonly string[]): { passed: number; skipped: number } => {
  let cache = readDevCache();
  if (!cache) {
    cache = { version: 1, steps: {} };
  }

  let passed = 0;
  let skipped = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepName = `${BUILD_CACHE_PREFIX}${step}`;
    const sourceFiles = getSourcesForStep(step);
    const sources = getSourcesMtime(sourceFiles);
    const cached = cache.steps[stepName];

    if (!isForce && !hasSourcesChanged(cached, sources)) {
      log.info(`  ○ ${basename(step)} (unchanged)`);
      skipped++;
      continue;
    }

    log.info(`  ▶ ${basename(step)}`);
    const stepPath = lookup('@', step).replace(/\\/g, '/');
    const result = spawnSync('bun', [stepPath], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });

    if (result.status !== 0) {
      log.error(`Error: ${basename(step)} failed — exit code ${result.status}`);
      log.error(`  Check the output above for details.`);
      return { passed: -1, skipped };
    }

    cache.steps[stepName] = createStepCache(sourceFiles);
    passed++;
  }

  writeDevCache(cache);
  return { passed, skipped };
};

logBox('Build Process', { Mode: mode });

log.info('\n--- Pre-build generators ---\n');
const preBuildResult = runPipelineWithCache(PIPELINE_STEPS.PRE_BUILD);
if (preBuildResult.passed === -1) process.exit(1);

log.info('\n--- Serve generators ---\n');
const serveResult = runPipelineWithCache(PIPELINE_STEPS.SERVE);
if (serveResult.passed === -1) process.exit(1);

log.info('\n--- Rsbuild (via wrapper) ---\n');
const rsbuildPath = lookup('@', PIPELINE_STEPS.RSBUILD).replace(/\\/g, '/');
log.info(`  ▶ rsbuild-wrapper`);
const rsbuildResult = spawnSync('bun', [rsbuildPath], {
  stdio: 'inherit',
  env: spawnEnv,
  cwd: process.cwd(),
});
if (rsbuildResult.status !== 0) {
  log.error(`Error: Rsbuild failed — exit code ${rsbuildResult.status}`);
  log.error(`  Check the output above for details.`);
  process.exit(1);
}

log.info('\n--- Post-build ---\n');
const postBuildResult = runPipelineWithCache(PIPELINE_STEPS.POST_BUILD);
if (postBuildResult.passed === -1) process.exit(1);

const totalPassed = preBuildResult.passed + serveResult.passed + 1 + postBuildResult.passed;
const totalSkipped = preBuildResult.skipped + serveResult.skipped + postBuildResult.skipped;

log.info('\n┌──────────────────────────────────────────┐');
log.info('│           Build completed                │');
log.info('├──────────────────────────────────────────┤');
if (totalSkipped > 0) {
  log.info(`│  Steps: ${totalPassed} run, ${totalSkipped} skipped          │`);
}
log.info('│  Run `bun run preview` for tunnel access │');
log.info('└──────────────────────────────────────────┘\n');
