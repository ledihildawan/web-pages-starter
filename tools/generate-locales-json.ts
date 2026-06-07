import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";

const LOCALES_DIR = path.resolve(process.cwd(), "src/locales");
const OUT_DIR = path.resolve(process.cwd(), "public/locales");

const PAGES = [
  "home",
  "about",
  "pricing",
  "contact",
  "features",
  "i18n-test",
  "404",
  "carousel-demo",
];

const COMPONENTS = ["cta"];

const readJson5OrNull = (filePath: string): unknown | null => {
  if (!fs.existsSync(filePath)) return null;
  return JSON5.parse(fs.readFileSync(filePath, "utf-8"));
};

const main = async (): Promise<void> => {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.warn(`[locales-json] Source not found: ${LOCALES_DIR}`);
    return;
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const locales = fs
    .readdirSync(LOCALES_DIR)
    .filter((name) => fs.statSync(path.join(LOCALES_DIR, name)).isDirectory());

  let totalFiles = 0;
  let totalBytes = 0;

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

  const { LOCALES, LOCALE_CODES } = await import(
    "../src/scripts/lib/i18n/data"
  );
  const { NUMBERING_SYSTEMS } = await import(
    "../src/scripts/lib/i18n/numbering-systems"
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
  const fontsByNs = Object.fromEntries(
    NUMBERING_SYSTEMS.map((ns) => [ns.code, ns.fontFamily]),
  );
  const allLocalesJson = JSON.stringify({
    locales: allLocalesCompact,
    numberingSystemFonts: fontsByNs,
  });
  fs.writeFileSync(path.join(OUT_DIR, "locales.json"), allLocalesJson);
  totalBytes += allLocalesJson.length;
  totalFiles += 1;

  console.log(
    `[locales-json] Wrote ${totalFiles} files (${(totalBytes / 1024).toFixed(1)} KiB) for ${locales.length} locales -> ${path.relative(process.cwd(), OUT_DIR)}`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
