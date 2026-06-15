import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { GENERATED } from '@constants';
import { FONT_CSS_PATHS } from '@i18n/data/font-paths';
import { LANGUAGES } from '@i18n/data/languages';
import type { LocaleCode, LocaleConfig } from '@i18n/data/locales';
import { LOCALE_CODES, LOCALES } from '@i18n/data/locales';
import { NUMBERING_SYSTEMS } from '@i18n/data/numbering-systems';
import { WRITING_SYSTEM, WRITING_SYSTEMS } from '@i18n/data/writing-systems';
import { log } from '@scripts/lib/logger';
import { generatedHeader, writeFilePath } from '@scripts/lib/write-file';
import { resolveRoot } from '@utils/paths';

const isProd = process.argv.includes('--prod');
const GENERATED_DIR = resolveRoot(GENERATED);
const OUTPUT_FILE = path.resolve(GENERATED_DIR, 'active-locales-data.ts');

const activeCodes: LocaleCode[] = isProd
  ? [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])]
  : LOCALE_CODES;

const activeLocales = LOCALES.filter((l) => activeCodes.includes(l.code));

const activeLanguageCodes: string[] = [
  ...new Set(activeLocales.map((l) => l.language)),
];
const activeNsCodes: string[] = [
  ...new Set(
    activeLocales.flatMap((l) => [l.numberingSystem, l.nativeNumberingSystem]),
  ),
];
const activeWsCodes: string[] = [
  ...new Set(activeLocales.map((l) => l.writingSystem)),
];

const languageEntries = LANGUAGES.filter((l) =>
  activeLanguageCodes.includes(l.code),
);
const nsEntries = NUMBERING_SYSTEMS.filter((s) =>
  activeNsCodes.includes(s.code),
);
const wsEntries = WRITING_SYSTEMS.filter((ws) =>
  activeWsCodes.includes(ws.code),
);

function serializeLocale(locale: LocaleConfig): string {
  const entries = Object.entries(locale).map(([key, value]) => {
    if (typeof value === 'string')
      return `${key}: '${value.replace(/'/g, "\\'")}'`;
    if (typeof value === 'boolean') return `${key}: ${value}`;
    return `${key}: ${value}`;
  });
  return `  { ${entries.join(', ')} }`;
}

function serializeLanguage(lang: {
  code: string;
  name: string;
  nativeName: string;
}): string {
  const escaped = lang.nativeName.replace(/'/g, "\\'");
  return `  { code: '${lang.code}', name: '${lang.name}', nativeName: '${escaped}' }`;
}

function serializeNumberingSystem(
  ns: (typeof NUMBERING_SYSTEMS)[number],
): string {
  const digits = ns.digits
    ? `[${ns.digits.map((d: string) => `'${d}'`).join(', ')}]`
    : 'null';
  return `  { code: '${ns.code}', type: '${ns.type}', digits: ${digits} }`;
}

function serializeWritingSystem(ws: (typeof WRITING_SYSTEMS)[number]): string {
  const langs = ws.languages.map((l: string) => `'${l}'`).join(', ');
  const nsList = ws.numberingSystems.map((ns: string) => `'${ns}'`).join(', ');
  const desc = ws.description.replace(/'/g, "\\'");
  const font = ws.defaultFont.replace(/'/g, "\\'");
  return `  { code: '${ws.code}', name: '${ws.name}', nameId: '${ws.nameId}', description: '${desc}', languages: [${langs}], numberingSystems: [${nsList}], direction: '${ws.direction}', defaultFont: '${font}' }`;
}

const filteredWritingSystem = Object.fromEntries(
  Object.entries(WRITING_SYSTEM).map(([key, value]) => {
    if (key.endsWith('_LANGUAGES') && Array.isArray(value)) {
      return [
        key,
        (value as readonly string[]).filter((lang) =>
          activeLanguageCodes.includes(lang),
        ),
      ];
    }
    return [key, value];
  }),
);

const activeFontEntries = Object.entries(FONT_CSS_PATHS).filter(([ns]) =>
  activeNsCodes.includes(ns),
);

function serializeFontEntry(ns: string, cssPath: string): string {
  return `  '${ns}': { css: '${cssPath}', loader: () => import('${cssPath}') }`;
}

const content = `${generatedHeader('packages/i18n/cli/generate-active-locales.ts')}

import type { LocaleCode, LocaleConfig } from '../packages/i18n/data/locales';

export const LOCALES: LocaleConfig[] = [
${activeLocales.map(serializeLocale).join(',\n')}
];

export const LOCALE_CODES: LocaleCode[] = LOCALES.map((l) => l.code);

export const ACTIVE_LANGUAGES = [
${languageEntries.map(serializeLanguage).join(',\n')}
] as const;

export const ACTIVE_NUMBERING_SYSTEMS = [
${nsEntries.map(serializeNumberingSystem).join(',\n')}
] as const;

export const ACTIVE_WRITING_SYSTEMS = [
${wsEntries.map(serializeWritingSystem).join(',\n')}
] as const;

export const WRITING_SYSTEM = ${JSON.stringify(filteredWritingSystem)} as Record<string, string | readonly string[]>;

export const ACTIVE_NOTO_SANS: Record<string, { css: string; loader: () => Promise<unknown> }> = {
${activeFontEntries.map(([ns, css]) => serializeFontEntry(ns, css)).join(',\n')}
};
`;

writeFilePath(OUTPUT_FILE, content);

const configActive = [i18nConfig.defaultLocale, ...(i18nConfig.locales ?? [])];

if (isProd) {
  log.success(
    `Generated production data — ${activeLocales.length} active locale(s): ${configActive.join(', ')}`,
  );
} else {
  log.success(
    `Generated dev stub — all ${LOCALES.length} locales available for development (${configActive.length} active in config)`,
  );
}
