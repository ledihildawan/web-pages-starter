import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'pathe';
import { log } from '@core/utils/logger';
import { DEFAULT_OUTPUT_DIR, MAX_REPORTS } from './constants';
import type { CategoryScore, PageScore } from './formatter';

export interface RunOptions {
  urls: string[];
  formFactor: 'desktop' | 'mobile' | 'both';
  categories: string[];
  outputs: string[];
  outputDir: string;
  extraHeaders?: string | null;
  throttlingMethod?: string;
  view?: boolean;
}

export interface RunResult {
  success: boolean;
  results: PageScore[];
  reportDir: string;
}

function slugifyUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/\/$/, '').replace(/^\//, '');
    return pathname.replace(/\//g, '-') || 'index';
  } catch {
    return url
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .replace(/^-/, '');
  }
}

function getExtraHeaders(url: string, args: string[]): string | null {
  const hasNgrokFlag = args.includes('--ngrok');
  const isNgrokUrl = url.includes('ngrok');
  if (hasNgrokFlag || isNgrokUrl) {
    return JSON.stringify({ 'ngrok-skip-browser-warning': '1' });
  }
  return null;
}

interface LighthouseJsonResult {
  categories?: Record<string, { score?: number }>;
  finalUrl?: string;
  requestedUrl?: string;
}

function parseLighthouseJson(jsonPath: string, categories: string[]): PageScore {
  const content = readFileSync(jsonPath, 'utf-8');
  const data: LighthouseJsonResult = JSON.parse(content);
  const categoriesData = data.categories || {};

  const categoryScores: CategoryScore[] = categories.map((catId) => {
    const catData = categoriesData[catId];
    if (!catData) return { id: catId, score: null };

    if (catId === 'agentic') {
      return {
        id: catId,
        score: null,
        rating: undefined,
      };
    }

    return {
      id: catId,
      score: catData.score !== undefined ? Math.round(catData.score * 100) : null,
    };
  });

  const passed = categoryScores.filter((c) => c.id !== 'agentic').every((cat) => cat.score === null || cat.score >= 90);

  return {
    url: data.finalUrl || data.requestedUrl || '',
    path: new URL(data.finalUrl || data.requestedUrl || '').pathname,
    categories: categoryScores,
    passed,
  };
}

export async function runLighthouse(url: string, args: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    log.info(`\n${label} Running Lighthouse for ${url}...`);
    const proc = spawn('bunx', ['lighthouse', url, ...args], {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: false,
    });

    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 || code === 1) {
        if (code === 1 && stderr && !stderr.includes('EPERM') && !stderr.includes('Permission denied')) {
          process.stderr.write(stderr);
        }
        resolve();
      } else {
        if (stderr) process.stderr.write(stderr);
        reject(new Error(`Lighthouse exited with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'EPERM') {
        log.warn('Chrome cleanup warning (non-critical)');
        return;
      }
      reject(err);
    });
  });
}

export async function runAudit(options: RunOptions): Promise<RunResult> {
  const { urls, formFactor, categories, outputs, outputDir, extraHeaders, throttlingMethod, view } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportDir = join(outputDir, timestamp);
  mkdirSync(reportDir, { recursive: true });

  const formFactorsToRun = formFactor === 'both' ? ['desktop', 'mobile'] : [formFactor as 'desktop' | 'mobile'];
  const outputArgs = outputs.map((o) => `--output=${o}`);

  const tasks: { url: string; ff: string; outputPath: string; args: string[] }[] = [];

  for (const url of urls) {
    for (const ff of formFactorsToRun) {
      const urlSlug = slugifyUrl(url);
      const ffDir = join(reportDir, ff);
      mkdirSync(ffDir, { recursive: true });
      const outputPath = join(ffDir, urlSlug).replace(/\\/g, '/');

      const args = [
        ...outputArgs,
        '--quiet',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--only-categories',
        categories.join(','),
        '--output-path',
        outputPath,
      ];

      if (throttlingMethod) {
        args.push('--throttling-method', throttlingMethod);
      }

      if (ff === 'mobile') {
        args.push('--form-factor=mobile');
      } else {
        args.push('--preset=desktop');
      }

      const headers = extraHeaders ?? getExtraHeaders(url, []);
      if (headers) {
        args.push('--extra-headers', headers);
      }

      if (view && outputs.includes('html')) {
        args.push('--view');
      }

      tasks.push({ url, ff, outputPath, args });
    }
  }

  const results: PageScore[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskIndex = `${i + 1}/${tasks.length}`;
    const label = `[${taskIndex}] ${task.ff}`;

    try {
      await runLighthouse(task.url, task.args, label);

      if (outputs.includes('json')) {
        const jsonPath = `${task.outputPath}.report.json`;
        if (existsSync(jsonPath)) {
          const pageScore = parseLighthouseJson(jsonPath, categories);
          if (!results.find((r) => r.url === pageScore.url && r.path === pageScore.path)) {
            results.push(pageScore);
          }
        }
      }
    } catch (err) {
      log.error(`Failed: ${task.url} (${task.ff}) - ${(err as Error).message}`);
    }
  }

  return {
    success: results.length > 0,
    results,
    reportDir,
  };
}

export function cleanupOldReports(outputDir: string = DEFAULT_OUTPUT_DIR): void {
  if (!existsSync(outputDir)) return;

  const entries = readdirSync(outputDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, path: join(outputDir, e.name), time: new Date(e.name).getTime() }))
    .sort((a, b) => b.time - a.time);

  if (entries.length > MAX_REPORTS) {
    const toDelete = entries.slice(MAX_REPORTS);
    for (const entry of toDelete) {
      rmSync(entry.path, { recursive: true, force: true });
      log.info(`Cleaned up old report: ${entry.name}`);
    }
  }
}
