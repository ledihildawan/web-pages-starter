import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { LOCALE_CODES } from '../src/scripts/lib/i18n/data';
import { collectKeys, readJSON5 } from '../src/scripts/utils/json5';

const LOCALES_DIR = path.resolve(PATHS.LOCALES);
const BASE_LOCALE = i18nConfig.defaultLocale;

interface LocaleDiff {
  locale: string;
  missing: string[];
  extra: string[];
  dupKeys?: Record<string, number>;
}

interface FileReport {
  file: string;
  totalKeys: number;
  diffs: LocaleDiff[];
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function findDuplicateKeys(content: string): Record<string, number> {
  const scopeStack: Map<string, number>[] = [];
  const dupes: Record<string, number> = {};

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') {
      scopeStack.push(new Map());
    } else if (ch === '}' && scopeStack.length > 0) {
      scopeStack.pop();
    } else if (scopeStack.length > 0 && (ch === '"' || ch === "'")) {
      const quote = ch;
      let j = i + 1;
      while (j < content.length && content[j] !== quote) {
        if (content[j] === '\\') j++;
        j++;
      }
      const key = content.slice(i + 1, j);
      let k = j + 1;
      while (k < content.length && /\s/.test(content[k])) k++;
      if (content[k] === ':') {
        const scope = scopeStack[scopeStack.length - 1];
        const count = (scope.get(key) || 0) + 1;
        scope.set(key, count);
        if (count > 1) dupes[key] = (dupes[key] || 1) + 1;
      }
      i = j;
    }
  }
  return dupes;
}

function tryDetectDuplicates(locale: string, filePath: string): Record<string, number> | null {
  const full = path.join(LOCALES_DIR, locale, filePath);
  if (!fs.existsSync(full)) return null;
  try {
    const content = fs.readFileSync(full, 'utf8');
    const dupes = findDuplicateKeys(content);
    return Object.keys(dupes).length > 0 ? dupes : null;
  } catch {
    return null;
  }
}

function getSetDifference(setA: Set<string>, setB: Set<string>): string[] {
  return [...setA].filter((x) => !setB.has(x));
}

function tryReadKeys(locale: string, filePath: string): Set<string> | null {
  const full = path.join(LOCALES_DIR, locale, filePath);
  if (!fs.existsSync(full)) return null;
  try {
    return new Set(collectKeys(readJSON5(full)));
  } catch (err) {
    console.error(`  ⚠️  Error reading ${locale}/${filePath}: ${err}`);
    return null;
  }
}

function checkFileParity(filePath: string): FileReport | null {
  const baseKeys = tryReadKeys(BASE_LOCALE, filePath);
  if (!baseKeys) {
    console.error(`  ⚠️  Base file missing: ${BASE_LOCALE}/${filePath}`);
    return null;
  }

  const diffs: LocaleDiff[] = [];

  for (const locale of LOCALE_CODES) {
    if (locale === BASE_LOCALE) continue;
    const localeKeys = tryReadKeys(locale, filePath);
    if (!localeKeys) {
      diffs.push({ locale, missing: [...baseKeys], extra: [] });
      continue;
    }
    const missing = getSetDifference(baseKeys, localeKeys);
    const extra = getSetDifference(localeKeys, baseKeys);
    const dupKeys = tryDetectDuplicates(locale, filePath) ?? undefined;
    if (missing.length > 0 || extra.length > 0 || dupKeys) {
      diffs.push({ locale, missing, extra, dupKeys });
    }
  }

  if (diffs.length === 0) return null;

  return { file: filePath, totalKeys: baseKeys.size, diffs };
}

function checkParity() {
  const allReports: FileReport[] = [];
  const fileBaseSizes = new Map<string, number>();

  function checkAndTrack(filePath: string): void {
    const report = checkFileParity(filePath);
    const keys = tryReadKeys(BASE_LOCALE, filePath);
    if (keys) fileBaseSizes.set(filePath, keys.size);
    if (report) allReports.push(report);
  }

  console.log('\n📋 Checking common.json5...');
  checkAndTrack('common.json5');

  const baseDir = path.join(LOCALES_DIR, BASE_LOCALE);
  if (fs.existsSync(baseDir)) {
    const pageFiles = fs
      .readdirSync(baseDir)
      .filter((f) => f.endsWith('.json5') && f !== 'common.json5');

    for (const file of pageFiles) {
      console.log(`📄 Checking ${file}...`);
      checkAndTrack(file);
    }

    const compDir = path.join(baseDir, 'components');
    if (fs.existsSync(compDir)) {
      for (const file of fs.readdirSync(compDir).filter((f) => f.endsWith('.json5'))) {
        console.log(`🧩 Checking components/${file}...`);
        checkAndTrack(`components/${file}`);
      }
    }
  }

  const baseTotal = [...fileBaseSizes.values()].reduce((s, v) => s + v, 0);

  const localeTotals = new Map<string, { missing: number; extra: number; dupeCount: number; totalKeys: number }>();
  for (const locale of LOCALE_CODES) {
    localeTotals.set(locale, { missing: 0, extra: 0, dupeCount: 0, totalKeys: baseTotal });
  }
  for (const r of allReports) {
    for (const d of r.diffs) {
      const t = localeTotals.get(d.locale)!;
      t.missing += d.missing.length;
      t.extra += d.extra.length;
      t.totalKeys += d.extra.length - d.missing.length;
      if (d.dupKeys) t.dupeCount += Object.keys(d.dupKeys).length;
    }
  }

  const summary = [...localeTotals.entries()].map(([locale, stats]) => ({
    locale,
    ...stats,
  }));

  return { reports: allReports, summary };
}

function printReport(
  report: ReturnType<typeof checkParity>,
): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🌍 LOCALE PARITY CHECK REPORT');
  console.log('='.repeat(60));

  const baseTotal = report.summary.find((s) => s.locale === BASE_LOCALE)?.totalKeys ?? 0;

  console.log('\n📊 Summary by Locale:');
  console.log('┌──────────────┬────────┬─────────┬───────┬──────────┬────────┐');
  console.log('│ Locale       │ Keys   │ Missing │ Extra │ Duplicate │ Status │');
  console.log('├──────────────┼────────┼─────────┼───────┼──────────┼────────┤');

  for (const { locale, totalKeys, missing, extra, dupeCount } of report.summary) {
    const hasIssue = missing > 0 || extra > 0 || dupeCount > 0 || totalKeys !== baseTotal;
    const color = hasIssue ? '\x1b[31m' : '\x1b[32m';
    const status = hasIssue ? 'Issues' : 'OK';
    const keysStr = totalKeys !== baseTotal ? `${color}${String(totalKeys).padStart(6)}\x1b[0m` : String(totalKeys).padStart(6);
    console.log(
      `│ ${locale.padEnd(12)} │ ${keysStr} │ ${color}${String(missing).padStart(7)}\x1b[0m │ ${String(extra).padStart(5)} │ ${String(dupeCount).padStart(8)} │ ${color}${status.padEnd(6)}\x1b[0m │`,
    );
  }
  console.log('└──────────────┴────────┴─────────┴───────┴──────────┴────────┘');

  const hasIssues = report.reports.length > 0;

  if (hasIssues) {
    console.log(`\n📄 Fix these locales to match ${BASE_LOCALE}:`);
    for (const data of report.reports) {
      for (const diff of data.diffs) {
        console.log(`\n  ${diff.locale}  ✗  ${data.file}`);
        if (diff.dupKeys) {
          for (const [key, count] of Object.entries(diff.dupKeys)) {
            console.log(`    ⚠️  duplicate key "${key}" (${count}x)`);
          }
        }
        const usedExtra = new Set<number>();
        const pairs: [string, string][] = [];

        for (let mi = 0; mi < diff.missing.length; mi++) {
          let bestDist = 4;
          let bestEi = -1;
          for (let ei = 0; ei < diff.extra.length; ei++) {
            if (usedExtra.has(ei)) continue;
            const dist = levenshtein(diff.missing[mi], diff.extra[ei]);
            if (dist < bestDist) {
              bestDist = dist;
              bestEi = ei;
            }
          }
          if (bestEi !== -1) {
            usedExtra.add(bestEi);
            pairs.push([diff.extra[bestEi], diff.missing[mi]]);
          } else {
            console.log(`    → add key "${diff.missing[mi]}"`);
          }
        }

        for (const [extra, miss] of pairs) {
          console.log(`    → rename "${extra}" → "${miss}"`);
        }
        for (let ei = 0; ei < diff.extra.length; ei++) {
          if (!usedExtra.has(ei)) console.log(`    → remove key "${diff.extra[ei]}"`);
        }
      }
    }
  }

  const localeCount = report.summary.filter((s) => s.missing > 0 || s.extra > 0 || s.dupeCount > 0).length;

  console.log(`\n${'═'.repeat(60)}`);
  if (localeCount === 0) {
    console.log('\x1b[32m✅ All locales have perfect parity!\x1b[0m');
  } else {
    const lbl = localeCount === 1 ? 'locale needs' : 'locales need';
    console.log(`\x1b[31m❌ ${localeCount} ${lbl} attention.\x1b[0m`);
  }
  console.log(`${'═'.repeat(60)}\n`);
}

const report = checkParity();
printReport(report);

const hasIssues = report.summary.some((s) => s.missing > 0 || s.extra > 0);
if (hasIssues) {
  process.exit(1);
}
