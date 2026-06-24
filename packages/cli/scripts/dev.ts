import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { basename, resolve as patheResolve } from 'pathe';
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
import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';

const spawnEnv: NodeJS.ProcessEnv = { ...process.env };

const cleanDevArtifacts = (): void => {
  const distDir = lookup('@dist');
  const rsbuildCache = lookup('@', 'node_modules/.cache/rsbuild');

  const cleanDir = (dir: string, name: string) => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        log.info(`  Cleaned: ${name}`);
      } catch {
        log.warn(`Warning: Could not clean ${name}`);
      }
    }
  };

  cleanDir(distDir, 'dist/');
  cleanDir(rsbuildCache, 'node_modules/.cache/rsbuild');
};

const CONFIG_WATCH_PATHS = ['configs/*.ts', 'configs/**/*.ts', '.env', '.env.*', 'package.json', 'tsconfig.json'];

let watchProcess: ReturnType<typeof spawn> | null = null;
let devProcess: ReturnType<typeof spawn> | null = null;
let configWatcher: FSWatcher | null = null;
let restartTimeout: ReturnType<typeof setTimeout> | null = null;
let isRestarting = false;

const cleanup = () => {
  if (watchProcess) {
    watchProcess.kill();
    watchProcess = null;
  }
  if (devProcess) {
    devProcess.kill();
    devProcess = null;
  }
  if (configWatcher) {
    configWatcher.close();
    configWatcher = null;
  }
};

const restartDevServer = () => {
  if (isRestarting) return;
  isRestarting = true;

  log.warn('\n\n⚠ Config changed — restarting dev server...\n');

  cleanup();

  setTimeout(() => {
    isRestarting = false;
    runDevServer();
  }, 1000);
};

const debouncedRestart = () => {
  if (restartTimeout) clearTimeout(restartTimeout);
  restartTimeout = setTimeout(restartDevServer, 500);
};

const runDevServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    logBox('Dev Server', { Port: String(env.PORT), Host: env.HOST });

    watchProcess = spawn('bun', ['./packages/i18n/cli/watch.ts'], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });

    const rsbuildBin = patheResolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
    devProcess = spawn('bun', [rsbuildBin, 'dev'], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });

    configWatcher = chokidar.watch(CONFIG_WATCH_PATHS, {
      persistent: true,
      ignoreInitial: true,
    });

    configWatcher.on('change', (path: string) => {
      log.info(`\n  ● Config changed: ${basename(path)}`);
      debouncedRestart();
    });

    configWatcher.on('error', (err) => {
      log.error(`Config watcher error: ${err}`);
    });

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    devProcess.on('close', (code) => {
      if (code !== 0 && !isRestarting) {
        reject(
          new Error(
            `Rsbuild dev exited with code ${code}.\n` +
              '  Check the output above for details.\n' +
              '  Common causes:\n' +
              '    - Config file error (run `bun run typecheck` to check)\n' +
              '    - Missing dependencies (run `bun install`)\n' +
              '    - Port already in use (kill the process on port ' +
              String(env.PORT) +
              ')',
          ),
        );
      } else {
        resolve();
      }
    });
    devProcess.on('error', (err) => {
      reject(
        new Error(
          `Failed to start Rsbuild dev server: ${err.message}.\n` +
            '  Check that all dependencies are installed (run `bun install`)',
        ),
      );
    });
  });
};

const runPipelineWithCache = (): void => {
  let cache = readDevCache();
  if (!cache) {
    cache = { version: 1, steps: {} };
  }

  for (const step of PIPELINE_STEPS.PRE_BUILD_DEV) {
    const [stepPath, ...args] = Array.isArray(step) ? step : [step];
    const sourceFiles = getSourcesForStep(stepPath);
    const sources = getSourcesMtime(sourceFiles);
    const cached = cache.steps[stepPath];

    if (!hasSourcesChanged(cached, sources)) {
      log.info(`  ○ ${basename(stepPath)} (unchanged)`);
      continue;
    }

    log.info(`  ▶ ${basename(stepPath)}`);
    const resolvedPath = lookup('@', stepPath);
    const result = spawnSync('bun', [resolvedPath, ...args], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });

    if (result.status !== 0) {
      log.error(`Error: ${basename(stepPath)} failed — exit code ${result.status}`);
      process.exit(1);
    }

    cache.steps[stepPath] = createStepCache(sourceFiles);
  }

  writeDevCache(cache);
  log.success('Pipeline complete');
};

const main = async (): Promise<void> => {
  logBox('Dev Setup', { Stage: env.STAGE || 'development' });

  log.info('\n--- Cleaning dev artifacts ---');
  cleanDevArtifacts();
  log.info('');

  log.info('\n--- Pre-build generators (dev mode) ---');
  runPipelineWithCache();
  log.info('');

  log.info('\n--- Starting dev server ---\n');
  try {
    await runDevServer();
  } catch (err) {
    log.error(`Dev server error: ${(err as Error).message}`);
    process.exit(1);
  }
};

main();
