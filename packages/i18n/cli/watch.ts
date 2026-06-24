import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { relative, join } from 'pathe';
import process from 'node:process';
import { lookup } from '@generated/paths';
import { log, logBox } from '@web-pages-starter/core/logger';
import { setupSigintHandler } from '@web-pages-starter/core/signal-handler';
import chokidar from 'chokidar';

const LOCALE_DIR = lookup('@locales');
const I18N_CONFIG = lookup('@config', 'i18n.ts');
const GENERATED_DIR = lookup('@generated');
const PAGES_DIR = lookup('@pages');
const SHARED_DIR = lookup('@shared');
const LAYOUTS_DIR = lookup('@layouts');
const PUBLIC_DIR = lookup('@public');
const RELOAD_FILE = join(PUBLIC_DIR, 'reload.json');

if (!fs.existsSync(LOCALE_DIR)) {
  log.error(`Error: Locale directory not found at ${LOCALE_DIR}`);
  process.exit(1);
}

const WATCH_PATHS = [LOCALE_DIR, I18N_CONFIG, GENERATED_DIR, PAGES_DIR, SHARED_DIR, LAYOUTS_DIR];

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
      touchReload();
    } catch (err) {
      log.error(`Regeneration failed: ${err}`);
    }
  }, 300);
}

let lastReloadTime = 0;

function touchReload() {
  lastReloadTime = Date.now();
  const reloadData = JSON.stringify({ t: lastReloadTime, path: RELOAD_FILE });
  fs.writeFileSync(RELOAD_FILE, reloadData);
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
      touchReload();
    } catch (err) {
      log.error(`Data regeneration failed: ${err}`);
    }
  } else if (filePath.endsWith('.njk') || filePath.endsWith('.html') || filePath.endsWith('.md')) {
    log.info(`${event}: ${relativePath} — triggering reload`);
    touchReload();
  } else if (filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
    if (filePath.includes('/pages/') || filePath.includes('/shared/') || filePath.includes('/layouts/')) {
      log.info(`${event}: ${relativePath} — triggering reload`);
      touchReload();
    }
  }
});

watcher.on('error', (err) => {
  log.error(`Error: File watcher failed — ${err}`);
  process.exit(1);
});

setupSigintHandler();
