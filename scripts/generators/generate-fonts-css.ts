import fs from 'node:fs';
import path from 'node:path';
import { fontsConfig } from '@config/fonts';
import { i18nConfig } from '@config/i18n';
import { lookup } from '@generated/paths';
import { buildFontsCss } from '@i18n/fonts/font-css';
import { log, logBox } from '@scripts/lib/logger';
import { generatedHeader } from '@scripts/lib/write-file';

const OUTPUT_DIR = lookup('@public', 'assets', 'fonts');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'fonts.css');

const allLocales = [...new Set([i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])])];
const packageCss = buildFontsCss(allLocales, './');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const pkgCss of packageCss) {
  const pkgName = pkgCss.pkg.replace('@', '').replace('/', '-');
  const pkgDir = path.join(OUTPUT_DIR, pkgName, 'files');

  fs.mkdirSync(pkgDir, { recursive: true });

  for (const fontFile of pkgCss.fontFiles) {
    const srcPath = path.join(lookup('@', 'node_modules', pkgCss.pkg, 'files', fontFile));
    const destPath = path.join(pkgDir, fontFile);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (packageCss.length > 0) {
  const header = `${generatedHeader('scripts/generators/generate-fonts-css.ts', {
    description: [
      `Active locales: ${allLocales.join(', ')}`,
      `Font packages: ${packageCss.map((p) => `${path.basename(p.pkg)} (${p.subsetCount})`).join(', ')}`,
    ].join('\n'),
  })}\n\n`;
  const combined = packageCss.map((p) => p.css).join('\n\n');
  const cssCustomProps = `:root {\n${Object.entries(fontsConfig)
    .flatMap(([key, font]) => (font ? [`  --font-${key}: "${font.family}";`] : []))
    .join('\n')}\n}\n`;

  fs.writeFileSync(OUTPUT_FILE, `${header + combined}\n\n${cssCustomProps}`, 'utf-8');
} else {
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE);
  }
}

logBox('Generate Fonts CSS', {
  Locales: allLocales.join(', '),
  Packages: packageCss.map((p) => `${path.basename(p.pkg)} (${p.subsetCount})`).join(', ') || '(none)',
  Output: 'public/assets/fonts/fonts.css',
});
log.success(
  `Done: ${packageCss.length} font package(s), ${packageCss.reduce((s, p) => s + p.subsetCount, 0)} subset(s) total`,
);
