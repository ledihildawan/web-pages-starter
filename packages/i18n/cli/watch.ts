import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { relative } from 'pathe';
import process from 'node:process';
import { lookup } from '@generated/paths';
import { log, logBox } from '@core/logger';
import { setupSigintHandler } from '@core/signal-handler';
import chokidar from 'chokidar';

const LOCALE_DIR = lookup('@locales');
const I18N_CONFIG = lookup('@config', 'i18n.ts');
const GENERATED_DIR = lookup('@generated');
const PAGES_DIR = lookup('@pages');

if (!fs.existsSync(LOCALE_DIR)) {
  log.error(`Error: Locale directory not found at ${LOCALE_DIR}`);
  process.exit(1);
}

const WATCH_PATHS = [LOCALE_DIR, I18N_CONFIG, GENERATED_DIR, PAGES_DIR];

logBox('Watch i18n Changes', {
  Watching: `${WATCH_PATHS.map((p) => p.replace(process.cwd(), '.'))
    .join(', ')
    .slice(0, 60)}...`,
});

const watcher = chokidar.watch(WATCH_PATHS, {
  persistent: true,
  ignoreInitial: true,
});

let regenerateTimeout: ReturnType<typeof setTimeout> | null = null;

function regenerate() {
  if (regenerateTimeout) {
    clearTimeout(regenerateTimeout);
  }
  regenerateTimeout = setTimeout(() => {
    try {
      log.info('Regenerating i18n types...');
      execSync('bun ./packages/i18n/cli/generate-active-locales.ts', { stdio: 'inherit' });
      execSync('bun ./packages/i18n/cli/sync-locales.ts', { stdio: 'inherit' });
      execSync('bun ./packages/i18n/cli/generate-types.ts --no-check', { stdio: 'inherit' });
      log.success('i18n regeneration complete');
    } catch (err) {
      log.error(`Regeneration failed: ${err}`);
    }
  }, 300);
}

watcher.on('all', (event, filePath) => {
  if (!filePath) return;

  const relativePath = relative(process.cwd(), filePath);

  if (filePath.endsWith('.json')) {
    log.info(`${event}: ${relativePath}`);
    regenerate();
  } else if (relativePath === 'configs/i18n.ts') {
    log.info(`${event}: ${relativePath} — triggering full regeneration`);
    regenerate();
  } else if (filePath.startsWith(GENERATED_DIR)) {
    log.info(`${event}: ${relativePath}`);
  } else if (filePath.endsWith('data.json5')) {
    log.info(`${event}: ${relativePath} — regenerating data types`);
    try {
      execSync('bun ./packages/cli/generators/pricing-types.ts', { stdio: 'inherit' });
      execSync('bun ./packages/cli/generators/images.ts', { stdio: 'inherit' });
      log.success('Data types regeneration complete');
    } catch (err) {
      log.error(`Data regeneration failed: ${err}`);
    }
  }
});

watcher.on('error', (err) => {
  log.error(`Error: File watcher failed — ${err}`);
  process.exit(1);
});

setupSigintHandler();
