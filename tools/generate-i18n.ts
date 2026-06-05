import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, LOCALE_CODES } from '../src/configs/locales';
import { LOCALE_FILE_EXTENSIONS, PATHS } from '../src/configs/paths';
import { collectKeys, readJson5File } from '../src/scripts/utils/json5';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, PATHS.LOCALES);
const DEFAULT_LOCALE_DIR = path.join(LOCALES_ROOT, DEFAULT_LOCALE);
const GENERATED_DIR = path.join(ROOT, PATHS.GENERATED);
const OUTPUT_FILE = path.join(GENERATED_DIR, 'i18n.d.ts');

const INDENT = '  ';
const LOCALE_EXTS = LOCALE_FILE_EXTENSIONS;

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
        throw new Error(`Duplicate locale namespace "${namespace}" in ${currentDir}`);
      }

      namespaces[namespace] = readJson5File(entryPath);
    }
  };

  walk(dirPath);
  return namespaces;
}

function pickPages(namespaces: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(namespaces).filter(([namespace]) =>
      namespace !== 'common' && !namespace.startsWith('components/'),
    ),
  );
}

function pickComponents(namespaces: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(namespaces)
      .filter(([namespace]) => namespace.startsWith('components/'))
      .map(([namespace, data]) => [namespace.replace(/^components\//, ''), data]),
  );
}

function compareLocaleParity(defaultData: Record<string, unknown>, langData: Record<string, unknown>, lang: string): string[] {
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

    for (const key of missingKeys) errors.push(`${lang}:${namespace} missing key "${key}"`);
    for (const key of extraKeys) errors.push(`${lang}:${namespace} extra key "${key}"`);
  }

  for (const namespace of langNamespaces) {
    if (!(namespace in defaultData)) errors.push(`${lang}: extra namespace "${namespace}"`);
  }

  return errors;
}

try {
  console.log('Generating i18n definitions...');

  const defaultNamespaces = readLocaleTree(DEFAULT_LOCALE_DIR);
  const commonData = defaultNamespaces.common;
  const pagesData = pickPages(defaultNamespaces);
  const componentsData = pickComponents(defaultNamespaces);

  if (!commonData) {
    throw new Error(`Missing default common locale: ${path.join(DEFAULT_LOCALE_DIR, 'common.json5')}`);
  }

  const parityErrors = LOCALE_CODES.flatMap((lang) => {
    const langDir = path.join(LOCALES_ROOT, lang);
    if (!fs.existsSync(langDir)) return [`${lang}: missing locale directory`];
    return compareLocaleParity(defaultNamespaces, readLocaleTree(langDir), lang);
  });

  if (parityErrors.length > 0) {
    // Soft-fail by design: the throw here would block `bun run build` whenever
    // a single locale is out of date. Use `bun run check:parity` for the
    // authoritative, hard-failing parity report.
    console.warn(
      `[i18n] ${parityErrors.length} parity issue(s) detected. Run \`bun run check:parity\` for details.`,
    );
  }

    const commonKeys = collectKeys(commonData).map((k) => `'common:${k}'`);
    const pageKeys = Object.entries(pagesData).flatMap(([page, data]) =>
        collectKeys(data).map((k) => `'${page}:${k}'`)
    );
    const compKeys = Object.entries(componentsData).flatMap(([comp, data]) =>
        collectKeys(data).map((k) => `'components/${comp}:${k}'`)
    );

  const allKeys = [...commonKeys, ...pageKeys, ...compKeys].map(k => `  | ${k}`).join('\n');

  const timestamp = new Date().toISOString();
  const output = `/**
 * Auto-generated i18n TypeScript definitions
 * Generated by: tools/generate-i18n.ts
 * Generated at: ${timestamp}
 *
 * WARNING: DO NOT EDIT MANUALLY
 * This file is automatically updated. Run \`bun run gen:i18n\` to refresh.
 */

export type I18nTranslationKeys =
${allKeys};

export interface I18nCommon ${toTsInterface(commonData)}
export interface I18nPages ${toTsInterface(pagesData)}
export interface I18nComponents ${toTsInterface(componentsData)}
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output);

  console.log('i18n types generated successfully.');
} catch (error) {
  console.error('Generation failed:', error);
  process.exit(1);
}
