import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { resolveRoot } from '@config/paths';
import { log, logBox } from '@scripts/lib/logger';
import { setupSigintHandler } from '@scripts/lib/signal-handler';
import chokidar from 'chokidar';

const LOCALE_DIR = resolveRoot('locales');

if (!fs.existsSync(LOCALE_DIR)) {
  log.error(`Error: Locale directory not found at ${LOCALE_DIR}`);
  process.exit(1);
}

logBox('Watch i18n Changes', {
  Watching: LOCALE_DIR.replace(process.cwd(), '.').slice(0, 24),
});

const watcher = chokidar.watch(LOCALE_DIR, {
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, filePath) => {
  if (filePath.endsWith('.json')) {
    log.info(`${event}: ${path.basename(filePath)}`);
    log.info('Run `bun ./packages/i18n/cli/generate-types.ts` to regenerate types if needed.\n');
  }
});

watcher.on('error', (err) => {
  log.error(`Error: File watcher failed — ${err}`);
  process.exit(1);
});

setupSigintHandler();
