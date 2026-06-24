import { spawnSync } from 'node:child_process';
import { basename } from 'pathe';
import process from 'node:process';
import { log, logBox } from '@core/logger';
import { PIPELINE_STEPS } from '@core/pipeline';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';

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

const runStep = (step: string): boolean => {
  const stepPath = lookup('@', step).replace(/\\/g, '/');
  const result = spawnSync('bun', [stepPath], {
    stdio: 'inherit',
    env: spawnEnv,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    log.error(`Error: ${basename(step)} failed — exit code ${result.status}`);
    return false;
  }
  return true;
};

logBox('Build Process', { Mode: mode });

log.info('\n--- Pre-build generators ---\n');
for (const step of PIPELINE_STEPS.PRE_BUILD) {
  if (!runStep(step)) process.exit(1);
}

log.info('\n--- Serve generators ---\n');
for (const step of PIPELINE_STEPS.SERVE) {
  if (!runStep(step)) process.exit(1);
}

log.info('\n--- Rsbuild (via wrapper) ---\n');
if (!runStep(PIPELINE_STEPS.RSBUILD)) process.exit(1);

log.info('\n--- Post-build ---\n');
for (const step of PIPELINE_STEPS.POST_BUILD) {
  if (!runStep(step)) process.exit(1);
}

log.info('\n┌──────────────────────────────────────────┐');
log.info('│           Build completed                │');
log.info('├──────────────────────────────────────────┤');
log.info('│  Run `bun run preview` for tunnel access │');
log.info('└──────────────────────────────────────────┘\n');
