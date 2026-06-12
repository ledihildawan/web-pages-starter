import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { LOCALE_CODES } from '../src/scripts/lib/i18n/data';
import { log, logBox } from './shared/logger';

const LOCALES_ROOT = path.join(PATHS.ROOT, PATHS.LOCALES);

function createLocale(
  targetLang: string,
  sourceDir: string,
  targetDir: string,
): number {
  let created = 0;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    log.info(`  Created: ${targetLang}/`);
    created++;
  }

  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    if (file.endsWith('.json')) {
      const targetPath = path.join(targetDir, file);
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        log.info(`    ${file}`);
        created++;
      }
    }
  }

  return created;
}

try {
  logBox('Sync Locale Files', {
    Configured: LOCALE_CODES.length,
    Default: i18nConfig.defaultLocale,
  });

  const existingLocales = fs.existsSync(LOCALES_ROOT)
    ? fs.readdirSync(LOCALES_ROOT).filter((f) => {
        const stat = fs.statSync(path.join(LOCALES_ROOT, f));
        return stat.isDirectory() && !f.startsWith('.');
      })
    : [];

  const missingLocales = LOCALE_CODES.filter(
    (code) => !existingLocales.includes(code),
  );

  if (missingLocales.length === 0) {
    log.success('Done: All configured locales exist.\n');
    process.exit(0);
  }

  const sourceDir = path.join(LOCALES_ROOT, i18nConfig.defaultLocale);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Default locale directory not found: ${sourceDir}`);
  }

  log.info(
    `Creating ${missingLocales.length} missing locale(s) from ${i18nConfig.defaultLocale}:\n`,
  );

  let totalCreated = 0;
  for (const lang of missingLocales) {
    log.info(`${lang}:`);
    totalCreated += createLocale(
      lang,
      sourceDir,
      path.join(LOCALES_ROOT, lang),
    );
    log.info('');
  }

  logBox('Done', { Created: `${totalCreated} file(s)` });
  log.info('\nNext steps:');
  log.info('  1. Translate the new locale files');
  log.info('  2. Run `bun run build` to update types\n');
} catch (error) {
  log.error(`Error: Sync failed — ${error}`);
  process.exit(1);
}
