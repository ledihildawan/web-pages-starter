import { SCORE_COLOR, SCORE_THRESHOLDS } from './constants';

export interface CategoryScore {
  id: string;
  score: number | null;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export interface PageScore {
  url: string;
  path: string;
  categories: CategoryScore[];
  passed: boolean;
  agenticRatio?: string;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return '⚪';
  if (score <= SCORE_THRESHOLDS.poor) return SCORE_COLOR.poor;
  if (score <= SCORE_THRESHOLDS.needsImprovement) return SCORE_COLOR.needsImprovement;
  return SCORE_COLOR.good;
}

export function getScoreRating(score: number | null): 'good' | 'needs-improvement' | 'poor' | null {
  if (score === null) return null;
  if (score <= SCORE_THRESHOLDS.poor) return 'poor';
  if (score <= SCORE_THRESHOLDS.needsImprovement) return 'needs-improvement';
  return 'good';
}

export function formatScore(score: number | null): string {
  if (score === null) return 'N/A';
  return `${Math.round(score)}${getScoreColor(score)}`;
}

export function formatSummaryTable(results: PageScore[], categories: string[]): string {
  const headerLen = 85;
  const divider = '─'.repeat(headerLen);

  const categoryHeaders = categories
    .map((cat) => {
      const catName = cat === 'best-practices' ? 'BP' : cat.charAt(0).toUpperCase() + cat.slice(1);
      return catName.padEnd(6);
    })
    .join('│');

  const header = `│ URL${' '.repeat(25)}│ ${categoryHeaders} │ Status │`;
  const title = `│ Lighthouse Summary${' '.repeat(headerLen - 22)}│`;

  const rows = results.map((result) => {
    const path = result.path.length > 28 ? `${result.path.slice(0, 25)}...` : result.path.padEnd(28);
    const scores = result.categories.map((cat) => formatScore(cat.score).padEnd(6)).join('│');
    const status = result.passed ? '✓' : '✗';
    return `│ ${path} │ ${scores} │   ${status}   │`;
  });

  return [`┌${divider}┐`, title, `├${divider}┤`, header, `├${divider}┤`, ...rows, `└${divider}┘`].join('\n');
}

export function formatCsvLine(result: PageScore): string {
  const scores = result.categories.map((cat) => (cat.score !== null ? Math.round(cat.score).toString() : 'N/A'));
  return [result.path, ...scores, result.passed ? 'PASS' : 'FAIL'].join(',');
}

export function formatCsvHeader(categories: string[]): string {
  const catNames = categories.map((cat) => (cat === 'best-practices' ? 'best_practices' : cat));
  return ['url', ...catNames, 'status'].join(',');
}
