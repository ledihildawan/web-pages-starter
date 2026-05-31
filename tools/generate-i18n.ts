import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LANG, SUPPORTED_LANG_CODES } from '../src/configs/locales.js';
import { readJson5File } from './parse-json5.ts';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'src', 'locales');
const DEFAULT_LOCALE_DIR = path.join(LOCALES_ROOT, DEFAULT_LANG);
const GENERATED_DIR = path.join(ROOT, 'generated');
const OUTPUT_FILE = path.join(GENERATED_DIR, 'i18n.d.ts');

const INDENT = '  ';
const LOCALE_EXTS = ['.json5', '.json'] as const;

function getFlattenedKeys(obj: unknown, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return prefix ? [prefix] : [];
    }

    return Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).flatMap(([key, value]) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'object' && value !== null && !Array.isArray(value)
            ? getFlattenedKeys(value, newKey)
            : [newKey];
    });
}

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

        const defaultKeys = new Set(getFlattenedKeys(defaultData[namespace]));
        const langKeys = new Set(getFlattenedKeys(langData[namespace]));
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

    const parityErrors = SUPPORTED_LANG_CODES.flatMap((lang) => {
        const langDir = path.join(LOCALES_ROOT, lang);
        if (!fs.existsSync(langDir)) return [`${lang}: missing locale directory`];
        return compareLocaleParity(defaultNamespaces, readLocaleTree(langDir), lang);
    });

    if (parityErrors.length > 0) {
        throw new Error(`Locale parity check failed:\n${parityErrors.map((line) => `  - ${line}`).join('\n')}`);
    }

    const commonKeys = getFlattenedKeys(commonData).map((k) => `'common:${k}'`);
    const pageKeys = Object.entries(pagesData).flatMap(([page, data]) =>
        getFlattenedKeys(data).map((k) => `'${page}:${k}'`)
    );
    const compKeys = Object.entries(componentsData).flatMap(([comp, data]) =>
        getFlattenedKeys(data).map((k) => `'components/${comp}:${k}'`)
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
