import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { log, logBox } from '@core/utils/logger';
import { PIPELINE_STEPS } from '@core/utils/pipeline';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';

const spawnEnv: NodeJS.ProcessEnv = { ...process.env };

const runDevServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    logBox('Dev Server', { Port: String(env.PORT), Host: env.HOST });

    const watchProcess = spawn('bun', ['./packages/i18n/cli/watch.ts'], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
      shell: false,
    });

    const rsbuildBin = path.resolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
    const devProcess = spawn('bun', [rsbuildBin, 'dev'], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
      shell: false,
    });

    const cleanup = () => {
      watchProcess.kill();
      devProcess.kill();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    devProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Rsbuild dev exited with code ${code}`));
      } else {
        resolve();
      }
    });
    devProcess.on('error', reject);
  });
};

const main = async (): Promise<void> => {
  logBox('Dev Setup', { Stage: env.STAGE || 'development' });

  log.info('\n--- Pre-build generators ---\n');
  for (const step of PIPELINE_STEPS.PRE_BUILD) {
    const stepPath = lookup('@', step);
    const result = spawnSync('bun', [stepPath], {
      stdio: 'inherit',
      env: spawnEnv,
      cwd: process.cwd(),
    });
    if (result.status !== 0) {
      log.error(`Error: ${path.basename(step)} failed — exit code ${result.status}`);
      process.exit(1);
    }
  }

  log.info('\n--- Starting dev server ---\n');
  try {
    await runDevServer();
  } catch (err) {
    log.error(`Dev server error: ${(err as Error).message}`);
    process.exit(1);
  }
};

main();
