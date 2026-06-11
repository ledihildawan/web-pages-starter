import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import chokidar from 'chokidar';
import { PATHS } from '../src/configs/paths';
import { log } from './shared/logger';
import { setupSigintHandler } from './shared/signal-handler';

const LOCALE_DIR = path.resolve(process.cwd(), PATHS.LOCALES);

if (!fs.existsSync(LOCALE_DIR)) {
  log.error(`Error: Locale directory not found at ${LOCALE_DIR}`);
  process.exit(1);
}

log.info('┌────────────────────────────────────────┐');
log.info('│         Watch i18n Changes             │');
log.info('├────────────────────────────────────────┤');
log.info(
  `│  Watching: ${LOCALE_DIR.replace(process.cwd(), '.').slice(0, 24).padEnd(24)}│`,
);
log.info('└────────────────────────────────────────┘\n');

const watcher = chokidar.watch(LOCALE_DIR, {
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, filePath) => {
  if (filePath.endsWith('.json5')) {
    log.info(`${event}: ${path.basename(filePath)}`);
    log.info(
      'Run `bun ./tools/generate-i18n.ts` to regenerate types if needed.\n',
    );
  }
});

watcher.on('error', (err) => {
  log.error(`Error: File watcher failed — ${err}`);
  process.exit(1);
});

setupSigintHandler();
