import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LANG, SUPPORTED_LANG_CODES } from '../src/configs/locales';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'src/locales');

function createLocale(targetLang: string, sourceDir: string, targetDir: string): number {
  let created = 0;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`  Created: ${targetLang}/`);
    created++;
  }

  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory() && file === 'components') {
      const compTargetDir = path.join(targetDir, 'components');
      if (!fs.existsSync(compTargetDir)) {
        fs.mkdirSync(compTargetDir, { recursive: true });
      }

      const compFiles = fs.readdirSync(sourcePath).filter((f) => f.endsWith('.json5'));
      for (const compFile of compFiles) {
        const targetPath = path.join(compTargetDir, compFile);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(path.join(sourcePath, compFile), targetPath);
          console.log(`    components/${compFile}`);
          created++;
        }
      }
    } else if (file.endsWith('.json5')) {
      const targetPath = path.join(targetDir, file);
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`    ${file}`);
        created++;
      }
    }
  }

  return created;
}

try {
  console.log(`Configured languages: ${SUPPORTED_LANG_CODES.length}`);
  console.log(`Default: ${DEFAULT_LANG}\n`);

  const existingLocales = fs.existsSync(LOCALES_ROOT)
    ? fs.readdirSync(LOCALES_ROOT).filter((f) => {
        const stat = fs.statSync(path.join(LOCALES_ROOT, f));
        return stat.isDirectory() && !f.startsWith('.');
      })
    : [];

  const missingLocales = SUPPORTED_LANG_CODES.filter((code) => !existingLocales.includes(code));

  if (missingLocales.length === 0) {
    console.log('✅ All configured locales exist.');
    console.log('   Run: bun run gen:i18n\n');
    process.exit(0);
  }

  const sourceDir = path.join(LOCALES_ROOT, DEFAULT_LANG);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Default locale directory not found: ${sourceDir}`);
  }

  console.log(`Creating ${missingLocales.length} missing locale(s) from ${DEFAULT_LANG}:\n`);

  let totalCreated = 0;
  for (const lang of missingLocales) {
    console.log(`${lang}:`);
    totalCreated += createLocale(lang, sourceDir, path.join(LOCALES_ROOT, lang));
    console.log('');
  }

  console.log(`✅ Done! Created ${totalCreated} file(s).\n`);
  console.log('Next steps:');
  console.log('  1. bun run gen:i18n');
  console.log('  2. Translate the locale files');
} catch (error) {
  console.error('❌ Sync failed:', error);
  process.exit(1);
}
