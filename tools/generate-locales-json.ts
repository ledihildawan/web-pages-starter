import fs from 'node:fs';
import path from 'node:path';
import JSON5 from 'json5';

const LOCALES_DIR = path.resolve(process.cwd(), 'src/locales');
const OUT_DIR = path.resolve(process.cwd(), 'public/assets/i18n');

const COMPONENTS = ['cta'];

const readJson5OrNull = (filePath: string): unknown | null => {
  if (!fs.existsSync(filePath)) return null;
  return JSON5.parse(fs.readFileSync(filePath, 'utf-8'));
};

const getLocales = (): string[] => {
  if (!fs.existsSync(LOCALES_DIR)) return [];
  return fs
    .readdirSync(LOCALES_DIR)
    .filter((name) => fs.statSync(path.join(LOCALES_DIR, name)).isDirectory());
};

const getPagesFromLocale = (localeDir: string): string[] => {
  if (!fs.existsSync(localeDir)) return [];
  return fs
    .readdirSync(localeDir)
    .filter((f) => f.endsWith('.json5') && f !== 'common.json5')
    .map((f) => f.replace(/\.json5$/, ''));
};

const main = async (): Promise<void> => {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.warn(`[locales-json] Source not found: ${LOCALES_DIR}`);
    return;
  }

  const locales = getLocales();
  if (locales.length === 0) {
    console.warn('[locales-json] No locales found');
    return;
  }

  const sampleLocaleDir = path.join(LOCALES_DIR, locales[0]);
  const PAGES = getPagesFromLocale(sampleLocaleDir);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalFiles = 0;
  let totalBytes = 0;

  console.log('┌────────────────────────────────────────┐');
  console.log('│       📄 Generate Locales JSON          │');
  console.log('├────────────────────────────────────────┤');
  console.log(`│  Locales:   ${String(locales.length).padEnd(24)}│`);
  console.log(`│  Pages:     ${String(PAGES.length).padEnd(24)}│`);
  console.log(`│  Output:    ${OUT_DIR.replace(process.cwd(), '.').slice(0, 24).padEnd(24)}│`);
  console.log('└────────────────────────────────────────┘\n');

  for (const page of PAGES) {
    const pageOutDir = path.join(OUT_DIR, page);
    fs.mkdirSync(pageOutDir, { recursive: true });

    for (const locale of locales) {
      const localeDir = path.join(LOCALES_DIR, locale);

      const common = readJson5OrNull(path.join(localeDir, 'common.json5'));
      const pageData = readJson5OrNull(path.join(localeDir, `${page}.json5`));

      if (!pageData) continue;

      const compData: Record<string, unknown> = {};
      for (const component of COMPONENTS) {
        const data = readJson5OrNull(
          path.join(localeDir, 'components', `${component}.json5`),
        );
        if (data) {
          compData[component] = data;
        }
      }

      const merged = {
        common: common ?? {},
        comp: Object.keys(compData).length > 0 ? compData : undefined,
        page: pageData,
      };

      const json = JSON.stringify(merged);
      const p = path.join(pageOutDir, `${locale}.json`);
      fs.writeFileSync(p, json);
      totalBytes += json.length;
      totalFiles += 1;
    }
  }

  console.log('┌────────────────────────────────────────┐');
  console.log(`│  ✅ Wrote ${String(totalFiles).padEnd(18)}files          │`);
  console.log(`│     ${String((totalBytes / 1024).toFixed(1) + ' KiB').padEnd(28)}│`);
  console.log('├────────────────────────────────────────┤');
  console.log('│  📁 Generated files in public/assets/i18n/  │');
  console.log('└────────────────────────────────────────┘\n');
};

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
