import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";

const LOCALES_DIR = path.resolve(process.cwd(), "src/locales");
const OUT_DIR = path.resolve(process.cwd(), "public/locales");

const COMPONENTS = ["cta"];

const readJson5OrNull = (filePath: string): unknown | null => {
  if (!fs.existsSync(filePath)) return null;
  return JSON5.parse(fs.readFileSync(filePath, "utf-8"));
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
    .filter((f) => f.endsWith(".json5") && f !== "common.json5")
    .map((f) => f.replace(/\.json5$/, ""));
};

const main = async (): Promise<void> => {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.warn(`[locales-json] Source not found: ${LOCALES_DIR}`);
    return;
  }

  const locales = getLocales();
  if (locales.length === 0) {
    console.warn("[locales-json] No locales found");
    return;
  }

  const sampleLocaleDir = path.join(LOCALES_DIR, locales[0]);
  const PAGES = getPagesFromLocale(sampleLocaleDir);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalFiles = 0;
  let totalBytes = 0;

  console.log("┌────────────────────────────────────────┐");
  console.log("│       📄 Generate Locales JSON          │");
  console.log("├────────────────────────────────────────┤");
  console.log(`│  Locales:   ${String(locales.length).padEnd(24)}│`);
  console.log(`│  Pages:     ${String(PAGES.length).padEnd(24)}│`);
  console.log(`│  Output:    ${OUT_DIR.replace(process.cwd(), ".").slice(0, 24).padEnd(24)}│`);
  console.log("└────────────────────────────────────────┘\n");

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_DIR, locale);
    const outLocaleDir = path.join(OUT_DIR, locale);

    const common = readJson5OrNull(path.join(localeDir, "common.json5"));
    if (common) {
      fs.mkdirSync(outLocaleDir, { recursive: true });
      const p = path.join(outLocaleDir, "common.json");
      const json = JSON.stringify(common);
      fs.writeFileSync(p, json);
      totalBytes += json.length;
      totalFiles += 1;
    }

    for (const component of COMPONENTS) {
      const data = readJson5OrNull(
        path.join(localeDir, "components", `${component}.json5`),
      );
      if (data) {
        const json = JSON.stringify(data);
        const p = path.join(outLocaleDir, "components", `${component}.json`);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, json);
        totalBytes += json.length;
        totalFiles += 1;
      }
    }

    for (const page of PAGES) {
      const data = readJson5OrNull(path.join(localeDir, `${page}.json5`));
      if (data) {
        const json = JSON.stringify(data);
        const p = path.join(outLocaleDir, `${page}.json`);
        fs.writeFileSync(p, json);
        totalBytes += json.length;
        totalFiles += 1;
      }
    }
  }

  const { LOCALES } = await import(
    "../src/scripts/lib/i18n/data"
  );
  const allLocalesCompact = LOCALES.map((l) => ({
    code: l.code,
    language: l.language,
    region: l.region,
    flag: l.flag,
    dir: l.dir,
    currency: l.currency,
    nativeNumberingSystem: l.nativeNumberingSystem,
    writingSystem: l.writingSystem,
    timezone: l.timezone,
  }));
  const allLocalesJson = JSON.stringify({
    locales: allLocalesCompact,
  });
  fs.writeFileSync(path.join(OUT_DIR, "locales.json"), allLocalesJson);
  totalBytes += allLocalesJson.length;
  totalFiles += 1;

  console.log("┌────────────────────────────────────────┐");
  console.log(`│  ✅ Wrote ${String(totalFiles).padEnd(18)}files          │`);
  console.log(`│     ${String((totalBytes / 1024).toFixed(1) + " KiB").padEnd(28)}│`);
  console.log("└────────────────────────────────────────┘\n");
};

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
