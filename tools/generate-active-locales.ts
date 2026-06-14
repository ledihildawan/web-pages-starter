import path from 'node:path';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import type { LocaleCode, LocaleConfig } from '../src/scripts/lib/i18n/data';
import { LOCALE_CODES, LOCALES } from '../src/scripts/lib/i18n/data';
import { log } from './shared/logger';
import { generatedHeader, writeFilePath } from './shared/write-file';

const isProd = process.argv.includes('--prod');
const GENERATED_DIR = path.resolve(process.cwd(), PATHS.GENERATED);
const OUTPUT_FILE = path.resolve(GENERATED_DIR, 'active-locales-data.ts');

const activeCodes: LocaleCode[] = isProd
  ? [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])]
  : LOCALE_CODES;

const activeLocales = LOCALES.filter((l) => activeCodes.includes(l.code));

function serializeLocale(locale: LocaleConfig): string {
  const entries = Object.entries(locale).map(([key, value]) => {
    if (typeof value === 'string') return `${key}: '${value}'`;
    if (typeof value === 'boolean') return `${key}: ${value}`;
    return `${key}: ${value}`;
  });
  return `  { ${entries.join(', ')} }`;
}

const content = `${generatedHeader('tools/generate-active-locales.ts')}

import type { LocaleCode, LocaleConfig } from '../src/scripts/lib/i18n/data';

export const LOCALES: LocaleConfig[] = [
${activeLocales.map(serializeLocale).join(',\n')}
];

export const LOCALE_CODES: LocaleCode[] = LOCALES.map((l) => l.code);
`;

writeFilePath(OUTPUT_FILE, content);

const mode = isProd ? 'production (active-only)' : 'dev/test (all)';
log.success(
  `Generated active-locales-data.ts — ${activeLocales.length} entries (${mode})`,
);
