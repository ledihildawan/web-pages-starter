import fs from 'node:fs';
import path from 'node:path';
import { parseJson5 } from '../src/scripts/utils/json5';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'src/locales');

const correctStats = {
  community: 'Global Community',
  community_val: '50K+',
  projects: 'Projects Completed',
  projects_val: '120+',
  uptime: 'Uptime',
  uptime_val: '99.99%',
  rating: 'Rating',
  rating_val: '4.9/5'
};

const locales = fs.readdirSync(LOCALES_ROOT).filter(f =>
  fs.statSync(path.join(LOCALES_ROOT, f)).isDirectory()
);

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log(`Fixing stats keys in ${locales.length} locales...\n`);

for (const locale of locales.sort()) {
  const homePath = path.join(LOCALES_ROOT, locale, 'home.json5');

  if (!fs.existsSync(homePath)) {
    console.log(`  ✗ ${locale}/home.json5 not found`);
    skippedCount++;
    continue;
  }

  try {
    const content = fs.readFileSync(homePath, 'utf-8');
    const data = parseJson5(content);

    if (data.stats) {
      data.stats = { ...correctStats };
      fs.writeFileSync(homePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log(`  ✓ ${locale}/home.json5 - stats replaced with canonical keys`);
      updatedCount++;
    } else {
      console.log(`  - ${locale}/home.json5 - no stats section, skipped`);
      skippedCount++;
    }
  } catch (e) {
    console.error(`  ✗ ${locale}/home.json5: ${e.message}`);
    errorCount++;
  }
}

console.log(`\nDone! Updated ${updatedCount} file(s), skipped ${skippedCount}, ${errorCount} error(s).`);
console.log('Run `bun run gen:i18n` to regenerate i18n types.');