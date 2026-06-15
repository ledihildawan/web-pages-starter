import { spawn } from 'node:child_process';

const proc = spawn('bun', ['./packages/i18n/cli/generate-active-locales.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

proc.on('close', (code) => {
  if (code !== 0) {
    console.warn(
      'Warning: postbuild dev stub restoration failed. Run `bun ./packages/i18n/cli/generate-active-locales.ts` manually before dev/test.',
    );
  }
  process.exit(0);
});

proc.on('error', () => {
  console.warn(
    'Warning: postbuild dev stub restoration failed. Run `bun ./packages/i18n/cli/generate-active-locales.ts` manually before dev/test.',
  );
  process.exit(0);
});
