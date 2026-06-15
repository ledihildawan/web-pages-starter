import { spawn } from 'node:child_process';
import { log } from './shared/logger';

const proc = spawn('bun', ['./packages/i18n/cli/generate-active-locales.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

proc.on('close', (code) => {
  if (code !== 0) {
    log.warn(
      'Warning: postbuild dev stub restoration failed. Run `bun ./packages/i18n/cli/generate-active-locales.ts` manually before dev/test.',
    );
  }
});

proc.on('error', () => {
  log.warn(
    'Warning: postbuild dev stub restoration failed. Run `bun ./packages/i18n/cli/generate-active-locales.ts` manually before dev/test.',
  );
});
