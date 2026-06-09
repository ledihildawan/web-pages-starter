import { execSync } from 'node:child_process';
import path from 'node:path';
import chokidar from 'chokidar';
import { PATHS } from '../src/configs/paths';

const LOCALE_DIR = path.resolve(process.cwd(), PATHS.LOCALES);

console.log('┌────────────────────────────────────────┐');
console.log('│         👁️ Watch i18n Changes            │');
console.log('├────────────────────────────────────────┤');
console.log(`│  Watching: ${LOCALE_DIR.replace(process.cwd(), '.').slice(0, 24).padEnd(24)}│`);
console.log('└────────────────────────────────────────┘\n');

const watcher = chokidar.watch(LOCALE_DIR, {
  persistent: true,
  ignoreInitial: true,
});

watcher.on('all', (event, filePath) => {
  if (filePath.endsWith('.json5')) {
    console.log(`📝 ${event}: ${path.basename(filePath)}`);
    try {
      execSync('bun run gen:i18n', { stdio: 'inherit' });
      console.log('✅ i18n types updated.\n');
    } catch (error) {
      console.error('❌ Failed to update i18n types:', error);
    }
  }
});
