export const CATEGORIES_STABLE = [
  { name: 'Performance', value: 'performance', checked: true },
  { name: 'Accessibility', value: 'accessibility', checked: true },
  { name: 'Best Practices', value: 'best-practices', checked: true },
  { name: 'SEO', value: 'seo', checked: true },
] as const;

export const CATEGORIES_EXPERIMENTAL = [
  { name: 'Agentic Browsing', value: 'agentic', checked: false, experimental: true },
] as const;

export const CATEGORIES_ALL = [...CATEGORIES_STABLE, ...CATEGORIES_EXPERIMENTAL] as const;

export const PERFORMANCE_METRICS = [
  { name: 'First Contentful Paint', key: 'first-contentful-paint', weight: 0.1 },
  { name: 'Speed Index', key: 'speed-index', weight: 0.1 },
  { name: 'Largest Contentful Paint', key: 'largest-contentful-paint', weight: 0.25 },
  { name: 'Total Blocking Time', key: 'total-blocking-time', weight: 0.3 },
  { name: 'Cumulative Layout Shift', key: 'cumulative-layout-shift', weight: 0.25 },
] as const;

export const SCORE_COLOR = {
  poor: '🔴',
  needsImprovement: '🟠',
  good: '🟢',
} as const;

export const SCORE_THRESHOLDS = {
  poor: 49,
  needsImprovement: 89,
} as const;

export const DEFAULT_OUTPUT_DIR = 'temp/lighthouse-reports';
export const MAX_REPORTS = 10;
export const DEFAULT_OUTPUTS = ['html', 'json'] as const;
export const DEFAULT_FORM_FACTOR = 'desktop';
export const DEFAULT_THROTTLING_METHOD = 'devtools';
