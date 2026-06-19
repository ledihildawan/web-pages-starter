import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { lookup } from '@generated/paths';
import { LOCALE_CODES } from '@i18n/data/locales';
import { log, logBox } from '@scripts/lib/logger';

const LOCALES_ROOT = lookup('@locales');
const DEFAULT_LOCALE = i18nConfig.defaultLocale;
const sourceDir = path.join(LOCALES_ROOT, DEFAULT_LOCALE);

try {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`[i18n] Default locale directory not found: ${sourceDir}`);
  }

  const sourceFiles = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.json'));

  logBox('Sync Locale Files', {
    Configured: LOCALE_CODES.length,
    Default: DEFAULT_LOCALE,
    'Source files': sourceFiles.length,
  });

  let missingDirs = 0;
  let missingFiles = 0;

  for (const lang of LOCALE_CODES) {
    if (lang === DEFAULT_LOCALE) continue;

    const targetDir = path.join(LOCALES_ROOT, lang);
    const isNewDir = !fs.existsSync(targetDir);

    if (isNewDir) {
      fs.mkdirSync(targetDir, { recursive: true });
      missingDirs++;
    }

    for (const file of sourceFiles) {
      const targetPath = path.join(targetDir, file);
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(path.join(sourceDir, file), targetPath);
        missingFiles++;
      }
    }
  }

  if (missingDirs === 0 && missingFiles === 0) {
    log.success('Done: All configured locales are up to date.\n');
  } else {
    logBox('Done', {
      'New directories': missingDirs,
      'Missing files synced': missingFiles,
    });
    if (missingDirs > 0) {
      log.info('\nNext steps:');
      log.info('  1. Translate the new locale files');
      log.info('  2. Run `bun run build` to update types\n');
    } else {
      log.info('');
    }
  }
} catch (error) {
  log.error(`Error: Sync failed — ${error}`);
  process.exit(1);
}
