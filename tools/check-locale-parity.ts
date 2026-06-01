#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, LOCALE_CODES } from '../src/configs/locales';
import { PATHS } from '../src/configs/paths';
import { readJson5File } from '../src/scripts/utils/json5';

type JsonObject = Record<string, unknown>;

const LOCALES_DIR = path.resolve(PATHS.LOCALES);
const BASE_LOCALE = DEFAULT_LOCALE;

function getAllKeys(obj: unknown, prefix = ''): Set<string> {
  const keys = new Set<string>();

  if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.add(fullKey);

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedKeys = getAllKeys(value, fullKey);
        nestedKeys.forEach((k) => keys.add(k));
      }
    }
  }

  return keys;
}

function readJson5(locale: string, filename: string): JsonObject {
  const filePath = path.join(LOCALES_DIR, locale, filename);
  if (!fs.existsSync(filePath)) return {};

  try {
    return readJson5File(filePath) as JsonObject;
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error);
    return {};
  }
}

interface ParityReport {
  file: string;
  totalKeys: number;
  missingKeys: { locale: string; keys: string[] }[];
  extraKeys: { locale: string; keys: string[] }[];
}

function getSetDifference(setA: Set<string>, setB: Set<string>): string[] {
  return [...setA].filter((x) => !setB.has(x));
}

function checkFileParity(
  filePath: string,
  localeStats: Map<string, { missing: number; extra: number }>
): ParityReport {
  const baseKeys = getAllKeys(readJson5(BASE_LOCALE, filePath));
  const report: ParityReport = {
    file: filePath,
    totalKeys: baseKeys.size,
    missingKeys: [],
    extraKeys: [],
  };

  for (const locale of LOCALE_CODES) {
    if (locale === BASE_LOCALE) continue;

    const localeKeys = getAllKeys(readJson5(locale, filePath));
    const missing = getSetDifference(baseKeys, localeKeys);
    const extra = getSetDifference(localeKeys, baseKeys);

    if (missing.length > 0) report.missingKeys.push({ locale, keys: missing });
    if (extra.length > 0) report.extraKeys.push({ locale, keys: extra });

    const stats = localeStats.get(locale)!;
    stats.missing += missing.length;
    stats.extra += extra.length;
  }

  return report;
}

function checkParity() {
  const pages = new Map<string, ParityReport>();
  const components = new Map<string, ParityReport>();
  const localeStats = new Map<string, { missing: number; extra: number }>();

  for (const locale of LOCALE_CODES) {
    localeStats.set(locale, { missing: 0, extra: 0 });
  }

  console.log('\n📋 Checking common.json5...');
  const commonReport = checkFileParity('common.json5', localeStats);

  const baseLocaleDir = path.join(LOCALES_DIR, BASE_LOCALE);
  if (fs.existsSync(baseLocaleDir)) {
    const pageFiles = fs.readdirSync(baseLocaleDir)
      .filter((f) => f.endsWith('.json5') && f !== 'common.json5');

    for (const pageFile of pageFiles) {
      console.log(`📄 Checking ${pageFile}...`);
      const report = checkFileParity(pageFile, localeStats);
      if (report.missingKeys.length > 0 || report.extraKeys.length > 0) {
        pages.set(pageFile.replace(/\.(json5|json)$/, ''), report);
      }
    }
  }

  const componentsDir = path.join(LOCALES_DIR, BASE_LOCALE, 'components');
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir)
      .filter((f) => f.endsWith('.json5'));

    for (const compFile of componentFiles) {
      console.log(`🧩 Checking component: ${compFile}...`);
      const report = checkFileParity(`components/${compFile}`, localeStats);
      if (report.missingKeys.length > 0 || report.extraKeys.length > 0) {
        components.set(compFile.replace(/\.json5$/, ''), report);
      }
    }
  }

  const summary = [...localeStats.entries()].map(([locale, stats]) => ({
    locale,
    ...stats,
  }));

  return { common: commonReport, pages, components, summary };
}

function printKeysList(
  type: 'missing' | 'extra',
  items: { locale: string; keys: string[] }[],
  verbose: boolean,
  indent: string = '  '
) {
  const icon = type === 'missing' ? '❌' : '⚠️ ';
  const sign = type === 'missing' ? '-' : '+';

  for (const { locale, keys } of items) {
    const message = type === 'missing' ? `missing ${keys.length} keys` : `${keys.length} extra keys`;
    console.log(`${indent}${icon} ${locale}: ${message}`);

    if (verbose) {
      for (const key of keys.slice(0, 10)) {
        console.log(`${indent}  ${sign} ${key}`);
      }
      if (keys.length > 10) {
        console.log(`${indent}  ... and ${keys.length - 10} more`);
      }
    }
  }
}

function printReportSection(title: string, reports: ParityReport[], verbose: boolean) {
  if (reports.length === 0) return;

  console.log(`\n${title}`);
  for (const data of reports) {
    console.log(`  ${data.file} (${data.totalKeys} keys):`);
    printKeysList('missing', data.missingKeys, verbose, '    ');
    printKeysList('extra', data.extraKeys, verbose, '    ');
  }
}

function printReport(report: ReturnType<typeof checkParity>, verbose = false): void {
  console.log('\n' + '='.repeat(60));
  console.log('🌍 LOCALE PARITY CHECK REPORT');
  console.log('='.repeat(60));

  console.log('\n📊 Summary by Locale:');
  console.log('| Locale       | Missing | Extra | Status |');
  console.log('|--------------|---------|-------|--------|');

  for (const { locale, missing, extra } of report.summary) {
    const status = missing === 0 && extra === 0 ? '✅ OK' : '❌ Issues';
    console.log(
      `| ${locale.padEnd(12)} | ${String(missing).padStart(7)} | ${String(extra).padStart(5)} | ${status.padEnd(6)} |`
    );
  }

  const hasCommonIssues = report.common.missingKeys.length > 0 || report.common.extraKeys.length > 0;
  if (hasCommonIssues) {
    console.log(`\n📋 common.json5 (${report.common.totalKeys} keys):`);
    printKeysList('missing', report.common.missingKeys, verbose, '  ');
    printKeysList('extra', report.common.extraKeys, verbose, '  ');
  }

  printReportSection('📄 Pages with parity issues:', [...report.pages.values()], verbose);
  printReportSection('🧩 Components with parity issues:', [...report.components.values()], verbose);

  const totalIssues = report.summary.reduce(
    (acc, { missing, extra }) => acc + missing + extra,
    0
  );

  console.log('\n' + '='.repeat(60));
  if (totalIssues === 0) {
    console.log('✅ All locales have perfect parity!');
  } else {
    console.log(`❌ Found ${totalIssues} parity issues across all locales.`);
    console.log('   Run with --verbose to see all missing/extra keys.');
  }
  console.log('='.repeat(60) + '\n');
}

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

const report = checkParity();
printReport(report, verbose);

const totalIssues = report.summary.reduce(
  (acc, { missing, extra }) => acc + missing + extra,
  0
);

if (totalIssues > 0) {
  process.exit(1);
}