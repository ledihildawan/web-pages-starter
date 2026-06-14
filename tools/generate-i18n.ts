import fs from 'node:fs';
import path from 'node:path';
import { LOCALE_CODES } from '@i18n/data/locales';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { collectKeys, readJSON5 } from '../src/scripts/utils/json5';
import { log, logBox } from './shared/logger';
import { generatedHeader, writeFilePath } from './shared/write-file';

const LOCALES_ROOT = path.join(PATHS.ROOT, PATHS.LOCALES);
const DEFAULT_LOCALE_DIR = path.join(LOCALES_ROOT, i18nConfig.defaultLocale);
const OUTPUT_FILE = path.join(PATHS.ROOT, PATHS.GENERATED, 'i18n.d.ts');

const INDENT = '  ';
const LOCALE_EXTS = ['.json'] as const;

function toTsInterface(obj: unknown, indent = INDENT): string {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return 'string';
  }

  const entries = Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const childType = toTsInterface(value, indent + INDENT);
      return `${indent}${safeKey}: ${childType};`;
    })
    .join('\n');

  return `{\n${entries}\n${indent.slice(INDENT.length)}}`;
}

function isLocaleFile(filePath: string): boolean {
  return LOCALE_EXTS.some((ext) => filePath.endsWith(ext));
}

function stripLocaleExt(fileName: string): string {
  for (const ext of LOCALE_EXTS) {
    if (fileName.endsWith(ext)) return fileName.slice(0, -ext.length);
  }
  return fileName;
}

function readLocaleTree(dirPath: string): Record<string, unknown> {
  const namespaces: Record<string, unknown> = {};

  const walk = (currentDir: string, prefix = '') => {
    if (!fs.existsSync(currentDir)) return;

    for (const entry of fs.readdirSync(currentDir).sort()) {
      const entryPath = path.join(currentDir, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        walk(entryPath, `${prefix}${entry}/`);
        continue;
      }

      if (!isLocaleFile(entry)) continue;

      const namespace = `${prefix}${stripLocaleExt(entry)}`;
      if (namespaces[namespace]) {
        throw new Error(
          `Duplicate locale namespace "${namespace}" in ${currentDir}`,
        );
      }

      namespaces[namespace] = readJSON5(entryPath) as Record<string, unknown>;
    }
  };

  walk(dirPath);
  return namespaces;
}

function pickPages(
  namespaces: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(namespaces).filter(
      ([namespace]) =>
        namespace !== 'common' && !namespace.startsWith('components.'),
    ),
  );
}

function pickComponents(
  namespaces: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(namespaces)
      .filter(([namespace]) => namespace.startsWith('components.'))
      .map(([namespace, data]) => [
        namespace.replace(/^components\./, ''),
        data,
      ]),
  );
}

function compareLocaleParity(
  defaultData: Record<string, unknown>,
  langData: Record<string, unknown>,
  lang: string,
): string[] {
  const errors: string[] = [];
  const defaultNamespaces = Object.keys(defaultData).sort();
  const langNamespaces = Object.keys(langData).sort();

  for (const namespace of defaultNamespaces) {
    if (!(namespace in langData)) {
      errors.push(`${lang}: missing namespace "${namespace}"`);
      continue;
    }

    const defaultKeys = new Set(collectKeys(defaultData[namespace]));
    const langKeys = new Set(collectKeys(langData[namespace]));
    const missingKeys = [...defaultKeys].filter((key) => !langKeys.has(key));
    const extraKeys = [...langKeys].filter((key) => !defaultKeys.has(key));

    for (const key of missingKeys)
      errors.push(`${lang}:${namespace} missing key "${key}"`);
    for (const key of extraKeys)
      errors.push(`${lang}:${namespace} extra key "${key}"`);
  }

  for (const namespace of langNamespaces) {
    if (!(namespace in defaultData))
      errors.push(`${lang}: extra namespace "${namespace}"`);
  }

  return errors;
}

try {
  logBox('Generate i18n Type Definitions', {
    'Default locale': i18nConfig.defaultLocale,
    Output: 'i18n.d.ts',
  });

  const defaultNamespaces = readLocaleTree(DEFAULT_LOCALE_DIR);
  const commonData = defaultNamespaces.common;
  const pagesData = pickPages(defaultNamespaces);
  const componentsData = pickComponents(defaultNamespaces);

  if (!commonData) {
    throw new Error(
      `Missing default common locale: ${path.join(DEFAULT_LOCALE_DIR, 'common.json')}`,
    );
  }

  const parityErrors = LOCALE_CODES.flatMap((lang) => {
    const langDir = path.join(LOCALES_ROOT, lang);
    if (!fs.existsSync(langDir)) return [`${lang}: missing locale directory`];
    return compareLocaleParity(
      defaultNamespaces,
      readLocaleTree(langDir),
      lang,
    );
  });

  if (parityErrors.length > 0) {
    log.error(`Error: [i18n] ${parityErrors.length} parity issue(s) detected.`);
    for (const err of parityErrors) {
      log.error(`  ${err}`);
    }
    log.error(
      '\n   Run `bun ./tools/check-locale-parity.ts` for a detailed report.',
    );
    process.exit(1);
  }

  const commonKeys = collectKeys(commonData).map((k) => `'common:${k}'`);
  const pageKeys = Object.entries(pagesData).flatMap(([page, data]) =>
    collectKeys(data).map((k) => `'${page}:${k}'`),
  );
  const compKeys = Object.entries(componentsData).flatMap(([comp, data]) =>
    collectKeys(data).map((k) => `'components.${comp}:${k}'`),
  );

  const allKeyCount = commonKeys.length + pageKeys.length + compKeys.length;
  const allKeys = [...commonKeys, ...pageKeys, ...compKeys]
    .map((k) => `  | ${k}`)
    .join('\n');

  const header = generatedHeader('tools/generate-i18n.ts');
  const output = `${header}

export type I18nTranslationKeys =
${allKeys};

export interface I18nPages ${toTsInterface(pagesData)}
export interface I18nComponents ${toTsInterface(componentsData)}
`;

  writeFilePath(OUTPUT_FILE, output);

  const vscodeSettingsPath = path.join(PATHS.ROOT, '.vscode', 'settings.json');
  if (fs.existsSync(vscodeSettingsPath)) {
    const settings = JSON.parse(
      fs.readFileSync(vscodeSettingsPath, 'utf-8'),
    ) as Record<string, unknown>;
    let changed = false;

    const patch = (key: string, value: string) => {
      if (settings[key] !== value) {
        settings[key] = value;
        changed = true;
      }
    };

    patch('i18n-ally.sourceLanguage', i18nConfig.defaultLocale);
    patch('i18n-ally.displayLanguage', i18nConfig.defaultLocale);

    if (changed) {
      writeFilePath(
        vscodeSettingsPath,
        `${JSON.stringify(settings, null, 2)}\n`,
      );
      log.info('  .vscode/settings.json synced');
    }
  }

  log.info(`\n  ${allKeyCount} translation keys typed`);
  log.info(`  ${OUTPUT_FILE.replace(PATHS.ROOT, '.')}`);
  log.success('\nDone: i18n types generated');
} catch (error) {
  log.error(`Error: Generation failed — ${error}`);
  process.exit(1);
}
