import fs from 'node:fs';
import { join } from 'pathe';
import { ASSET_PATHS } from '@core/asset-paths';
import { log } from '@core/logger';
import { LOCALE_CODES } from '@generated/active-locales-data';
import { lookup } from '@generated/paths';

const localesSrc = lookup('@locales');
const localesPublicDest = lookup('@public', ASSET_PATHS.locales);
const localesDistDest = lookup('@dist', ASSET_PATHS.locales);
const activeLocales = LOCALE_CODES;

function main(): void {
  if (!fs.existsSync(localesSrc)) {
    log.warn(`[copy-locale-assets] Source locale directory not found: ${localesSrc}`);
    return;
  }

  // Copy to public/
  if (fs.existsSync(localesPublicDest)) {
    fs.rmSync(localesPublicDest, { recursive: true, force: true });
  }
  for (const locale of activeLocales) {
    const srcDir = join(localesSrc, locale);
    const destDir = join(localesPublicDest, locale);
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        fs.copyFileSync(join(srcDir, file), join(destDir, file));
      }
    }
  }
  log.info(`  Copied ${activeLocales.length} locale(s) to public`);

  // Copy public/ locale assets to dist/
  if (fs.existsSync(localesPublicDest)) {
    if (fs.existsSync(localesDistDest)) {
      fs.rmSync(localesDistDest, { recursive: true, force: true });
    }
    fs.cpSync(localesPublicDest, localesDistDest, { recursive: true });
    const count = fs
      .readdirSync(localesDistDest, { recursive: true })
      .filter((f): f is string => typeof f === 'string' && !fs.statSync(join(localesDistDest, f)).isDirectory()).length;
    log.info(`  Copied ${count} locale file(s) to dist`);
  }
}

main();
