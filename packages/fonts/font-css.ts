import fs from 'node:fs';
import { join, resolve } from 'pathe';
import type { LocaleCode } from '@web-pages-starter/i18n/data/locales';
import { LOCALES } from '@web-pages-starter/i18n/data/locales';
import type { FontPackageEntry } from './font-registry';
import { EXTRA_INTER_SUBSETS_FOR_LANGUAGE, FONT_FOR_WRITING_SYSTEM, INTER_PACKAGE } from './font-registry';

export function getActiveWritingSystems(locales: LocaleCode[]): string[] {
  const ws = new Set<string>();
  for (const code of locales) {
    const locale = LOCALES.find((l) => l.code === code);
    if (locale) ws.add(locale.writingSystem);
  }
  return Array.from(ws);
}

export function getNeededFontPackages(locales: LocaleCode[]): Map<string, FontPackageEntry[]> {
  const wsCodes = getActiveWritingSystems(locales);
  const packages = new Map<string, FontPackageEntry[]>();

  for (const ws of wsCodes) {
    const entries = FONT_FOR_WRITING_SYSTEM[ws];
    if (!entries) continue;
    for (const entry of entries) {
      const existing = packages.get(entry.pkg) ?? [];
      existing.push(entry);
      packages.set(entry.pkg, entry.subsets === 'all' ? [{ ...entry, subsets: 'all' }] : existing);
    }
  }

  const extraInter = new Set<string>();
  for (const code of locales) {
    const locale = LOCALES.find((l) => l.code === code);
    if (!locale) continue;
    const extras = EXTRA_INTER_SUBSETS_FOR_LANGUAGE[locale.language];
    if (extras) {
      for (const s of extras) extraInter.add(s);
    }
  }
  if (extraInter.size > 0) {
    const existing = packages.get(INTER_PACKAGE) ?? [];
    existing.push({ pkg: INTER_PACKAGE, family: 'Inter Variable', subsets: Array.from(extraInter) });
    packages.set(INTER_PACKAGE, existing);
  }

  return packages;
}

interface FontFaceBlock {
  comment: string;
  css: string;
  subset: string;
}

const KNOWN_SUBSETS = [
  'latin-ext',
  'latin',
  'cyrillic-ext',
  'cyrillic',
  'greek-ext',
  'greek',
  'vietnamese',
  'arabic',
  'math',
  'symbols',
  'thai',
  'bengali',
  'tamil',
  'telugu',
  'kannada',
  'malayalam',
  'gujarati',
  'gurmukhi',
  'sinhala',
  'khmer',
  'lao',
  'myanmar',
  'georgian',
  'ethiopic',
  'armenian',
  'hebrew',
  'devanagari',
  'oriya',
  'tibetan',
  'nko',
  'adlam',
];

function extractSubset(comment: string): string {
  const lower = comment.toLowerCase();
  for (const s of KNOWN_SUBSETS) {
    if (lower.includes(`-${s}-`)) return s;
  }
  const cjkMatch = lower.match(/-\[(\d+)\]-/) ?? lower.match(/-(\d+)-/);
  if (cjkMatch) return cjkMatch[1];
  return '';
}

export function parseFontFaceBlocks(css: string): FontFaceBlock[] {
  const blocks: FontFaceBlock[] = [];
  const regex = /\/\*\s*([\w[\]-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g;
  let match = regex.exec(css);
  while (match !== null) {
    const comment = match[1];
    const cssBlock = match[2];
    const subset = extractSubset(comment);
    blocks.push({ comment, css: cssBlock, subset });
    match = regex.exec(css);
  }
  return blocks;
}

function resolvePackagePath(pkg: string): string {
  const nodeModules = resolve(process.cwd(), 'node_modules', pkg);
  return nodeModules;
}

function readPackageWghtCss(pkg: string): string | null {
  const pkgDir = resolvePackagePath(pkg);
  const wghtPath = join(pkgDir, 'wght.css');
  if (fs.existsSync(wghtPath)) return fs.readFileSync(wghtPath, 'utf-8');
  const indexPath = join(pkgDir, 'index.css');
  if (fs.existsSync(indexPath)) return fs.readFileSync(indexPath, 'utf-8');
  return null;
}

export interface FontPackageCss {
  pkg: string;
  css: string;
  subsetCount: number;
  fontFiles: string[];
}

export function buildFontsCss(locales: LocaleCode[], fontsBasePath?: string): FontPackageCss[] {
  const packages = getNeededFontPackages(locales);
  const results: FontPackageCss[] = [];

  for (const [pkg, entries] of packages) {
    const rawCss = readPackageWghtCss(pkg);
    if (!rawCss) continue;

    const blocks = parseFontFaceBlocks(rawCss);
    if (blocks.length === 0) continue;

    const wantAll = entries.some((e) => e.subsets === 'all');
    const wantedSubsets = new Set<string>();
    if (!wantAll) {
      for (const e of entries) {
        if (e.subsets !== 'all') {
          for (const s of e.subsets) wantedSubsets.add(s);
        }
      }
    }

    const filtered = wantAll ? blocks : blocks.filter((b) => wantedSubsets.has(b.subset));

    if (filtered.length === 0) continue;

    const pkgDir = resolvePackagePath(pkg);
    const fontFiles: string[] = [];
    const css = filtered
      .map((b) => {
        const fileName = b.css.match(/url\(\.\/files\/([^)]+)\)/)?.[1];
        if (!fileName) return b.css;
        fontFiles.push(fileName);
        if (fontsBasePath) {
          const pkgName = pkg.replace('@', '').replace('/', '-');
          const relativePath = `./${pkgName}/files/${fileName}`;
          return b.css.replace(/url\(\.\/files\/([^)]+)\)/, `url('${relativePath}')`);
        }
        const resolved = join(pkgDir, 'files', fileName);
        return b.css.replace(/url\(\.\/files\/([^)]+)\)/, `url('${resolved.replace(/\\/g, '/')}')`);
      })
      .join('\n\n');

    results.push({ pkg, css, subsetCount: filtered.length, fontFiles });
  }

  return results;
}
