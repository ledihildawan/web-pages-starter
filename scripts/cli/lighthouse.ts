import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { env } from '@generated/env';
import { log, logBox } from '@scripts/lib/logger';
import { getAndVerifyPreviewUrl } from '@scripts/lib/preview-url';
import { setupSigintHandler, wrapMainError } from '@scripts/lib/signal-handler';
import inquirer from 'inquirer';
import { DOMParser } from 'linkedom';

const OUTPUT_DIR = env.LIGHTHOUSE_OUTPUT_DIR;

const hasNgrokFlag = (args: string[]) => args.includes('--ngrok');
const isNgrokUrl = (url: string) => url.includes('ngrok');
const getExtraHeaders = (url: string, args: string[]) =>
  hasNgrokFlag(args) || isNgrokUrl(url) ? JSON.stringify({ 'ngrok-skip-browser-warning': '1' }) : null;

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
};

const fetchSitemap = async (url: string, extraHeaders: string | null) => {
  const sitemapUrl = url.endsWith('/') ? `${url}sitemap.xml` : `${url}/sitemap.xml`;

  const headers: Record<string, string> = {};
  if (extraHeaders) {
    Object.assign(headers, JSON.parse(extraHeaders));
  }
  const res = await fetch(sitemapUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status}`);
  }
  return res.text();
};

const parseSitemap = (xml: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const urls = doc.querySelectorAll('url loc');
  return Array.from(urls).map((el) => ((el as Element).textContent ?? '').trim());
};

const runLighthouse = (url: string, args: string[], label: string, outputPath: string, outputTypes: string[]) => {
  return new Promise<void>((resolve, reject) => {
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
        if (outputTypes.includes('html')) {
          const htmlPath = `${outputPath}.html`;
          const reportHtmlPath = `${outputPath}.report.html`;
          if (fs.existsSync(htmlPath)) {
            fs.renameSync(htmlPath, reportHtmlPath);
          }
        }
        resolve();
      } else {
        if (stderr) process.stderr.write(stderr);
        reject(new Error(`Lighthouse exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
};

const buildArgs = (
  formFactor: string,
  categories: string[],
  outputTypes: string[],
  outputPath: string,
  view: boolean,
  url: string,
  cliArgs: string[],
) => {
  const args = [`--output=${outputTypes.join(',')}`, '--quiet'];

  const headers = getExtraHeaders(url, cliArgs);
  if (headers) {
    args.push('--extra-headers', headers);
  }

  const noThrottle = cliArgs.includes('--no-throttle');
  const chromeFlags = ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'];

  if (noThrottle) {
    args.push('--skip-throttling');
    chromeFlags.push('--disable-gpu-sandbox');
  } else {
    args.push('--quiet-throttle');
  }

  if (chromeFlags.length > 0) {
    args.push('--chrome-flags', chromeFlags.join(' '));
  }

  if (formFactor === 'desktop') {
    args.push('--preset=desktop');
  } else {
    args.push('--form-factor=mobile');
    if (noThrottle) {
      args.push('--screen-width=390', '--screen-height=844');
    }
  }

  if (categories && categories.length > 0) {
    args.push('--only-categories', categories.join(','));
  }

  const extMap: Record<string, string> = {
    html: '.report.html',
    json: '.report.json',
    csv: '.report.csv',
  };
  const finalPath = outputTypes.length === 1 ? outputPath + (extMap[outputTypes[0]] || '') : outputPath;
  args.push('--output-path', finalPath);

  if (view) {
    args.push('--view');
  }

  return args;
};

const slugify = (url: string) => {
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
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '\x1b[32m';
  if (score >= 50) return '\x1b[33m';
  return '\x1b[31m';
};

const parseScores = (reportDir: string) => {
  const scores: Record<string, Record<string, number>> = {};

  if (!fs.existsSync(reportDir)) return scores;

  const walkDir = (dir: string) => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(walkDir(fullPath));
      } else if (item.endsWith('.report.json')) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const jsonFiles = walkDir(reportDir);

  for (const filePath of jsonFiles) {
    let pageName = 'unknown';
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as {
        categories?: Record<string, { score: number }>;
        formFactor?: string;
      };
      const relPath = path.relative(reportDir, filePath);
      const parts = relPath.replace(/\\/g, '/').split('/');
      const ff = parts[0];
      const slug = parts[1].replace(/\.report\.json$/, '');
      pageName = `${slug}-${ff}`;

      scores[pageName] = {};
      if (data.categories) {
        for (const [key, cat] of Object.entries(data.categories)) {
          scores[pageName][key] = Math.round(cat.score * 100);
        }
      }
    } catch {
      log.warn(`Warning: Could not parse scores for ${pageName}`);
    }
  }

  return scores;
};

const main = async () => {
  const cliArgs = process.argv.slice(2);
  const view = cliArgs.includes('--view');
  const help = cliArgs.includes('--help');

  if (help) {
    log.info(`
Lighthouse Audit Tool

Audits accessibility, SEO, best practices, performance, and AI agent compatibility.
Helps identify runtime issues for accessibility, search visibility,
security, page speed, and how well AI assistants can understand your site.

Usage:
  bun run cli → Lighthouse (interactive)
  bun ./scripts/cli/lighthouse.ts [options]

Options:
  --mobile        Use mobile form factor
  --both          Run both desktop and mobile
  --all           Audit all categories
  --only-cats     Specific categories (e.g., --only-cats accessibility,seo)
  --output        Output formats (e.g., --output html,json)
  --url <path>    Audit specific URL path (e.g., --url /about)
  --no-sitemap    Audit base URL only
  --ngrok         Add ngrok-skip-browser-warning header
  --no-throttle   Disable CPU/network throttling (real-world results)
  --view          Open report in browser after audit
  --help          Show this help message

Categories:
  accessibility     Usability for everyone, including screen readers
  seo               Technical checks for search engine discoverability
  best-practices    Modern web standards, security, console errors
  performance       Page load and responsiveness metrics
  agentic-browsing  How well AI assistants can understand your site

Examples:
  bun run cli                                    Interactive mode
  bun ./scripts/cli/lighthouse.ts --mobile            Mobile accessibility audit
  bun ./scripts/cli/lighthouse.ts --both --no-throttle Full audit real-world results
  bun ./scripts/cli/lighthouse.ts --url /about        Audit specific page
`);
    process.exit(0);
  }

  let formFactor = cliArgs.includes('--mobile') ? 'mobile' : 'desktop';
  let runBoth = cliArgs.includes('--both');

  const categoriesList = [
    { name: 'Performance', value: 'performance', checked: true },
    { name: 'Accessibility', value: 'accessibility', checked: true },
    { name: 'Best Practices', value: 'best-practices', checked: true },
    { name: 'SEO', value: 'seo', checked: true },
    { name: 'Agentic Browsing', value: 'agentic-browsing', checked: false },
  ];

  const outputFormats = [
    { name: 'HTML - Browser viewable report', value: 'html', checked: true },
    { name: 'JSON - Machine readable data', value: 'json', checked: true },
    { name: 'CSV - Spreadsheet compatible', value: 'csv', checked: false },
  ];

  let categories: string[] = [];
  let outputTypes: string[] = [];

  const allCatsFlag = cliArgs.includes('--all');
  const onlyCatsFlag = cliArgs.includes('--only-cats');
  const outputFlag = cliArgs.includes('--output');

  if (outputFlag) {
    const outIndex = cliArgs.indexOf('--output');
    const outValue = cliArgs[outIndex + 1];
    if (outValue) {
      outputTypes = outValue.split(',').map((c) => c.trim());
    }
  }

  if (onlyCatsFlag) {
    const catsIndex = cliArgs.indexOf('--only-cats');
    const catsValue = cliArgs[catsIndex + 1];
    if (catsValue) {
      categories = catsValue.split(',').map((c) => c.trim());
    }
  } else if (allCatsFlag) {
    categories = categoriesList.map((c) => c.value);
  }

  if (!cliArgs.includes('--mobile') && !cliArgs.includes('--both')) {
    const { selectedFormFactor } = await inquirer.prompt([
      {
        type: 'select',
        name: 'selectedFormFactor',
        message: 'Select form factor:',
        choices: [
          { name: 'Desktop', value: 'desktop' },
          { name: 'Mobile', value: 'mobile' },
          { name: 'All (Desktop + Mobile)', value: 'both' },
        ],
        default: 'desktop',
      },
    ]);
    formFactor = selectedFormFactor === 'both' ? 'desktop' : selectedFormFactor;
    runBoth = selectedFormFactor === 'both';
  }

  if (categories.length === 0) {
    const { selectedCategories } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCategories',
        message: 'Select categories to audit:',
        choices: categoriesList,
        validate: (answer) => {
          if (answer.length === 0) return 'Select at least one category';
          return true;
        },
      },
    ]);

    categories = selectedCategories;
  }

  if (outputTypes.length === 0) {
    const { selectedOutputs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedOutputs',
        message: 'Select output formats:',
        choices: outputFormats,
        validate: (answer) => {
          if (answer.length === 0) return 'Select at least one output format';
          return true;
        },
      },
    ]);

    outputTypes = selectedOutputs;
  }

  let urls = [];

  const baseIdx = cliArgs.indexOf('--base');
  let baseUrl: string;

  if (baseIdx !== -1 && cliArgs[baseIdx + 1]) {
    baseUrl = cliArgs[baseIdx + 1];
  } else {
    const preview = await getAndVerifyPreviewUrl();
    if (!preview) {
      log.error('Preview server not running. Start with bun run preview first.');
      process.exit(1);
    }
    if (preview.reason === 'expired') {
      log.error('Preview URL expired. Start preview again to continue.');
      process.exit(1);
    }
    if (preview.reason === 'unaccessible') {
      log.error('Preview server no longer accessible. Start preview again.');
      process.exit(1);
    }
    baseUrl = preview.url;
  }

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (cliArgs.includes('--url')) {
    const urlIndex = cliArgs.indexOf('--url');
    const urlPath = cliArgs[urlIndex + 1];
    if (!urlPath) {
      log.error('Error: --url requires a path argument');
      process.exit(1);
    }
    urls = [`${base}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`];
  } else if (cliArgs.includes('--no-sitemap')) {
    urls = [baseUrl];
  } else {
    try {
      const sitemapXml = await fetchSitemap(baseUrl, getExtraHeaders(baseUrl, cliArgs));
      urls = parseSitemap(sitemapXml).map((u) => {
        if (baseIdx !== -1) {
          try {
            const parsed = new URL(u);
            return `${base}${parsed.pathname}`;
          } catch {
            return u;
          }
        }
        return u;
      });
    } catch (err) {
      log.warn(`Warning: Could not fetch sitemap — ${(err as Error).message}`);
      urls = [baseUrl];
    }
  }

  if (urls.length > 1 && !cliArgs.includes('--url') && !cliArgs.includes('--no-sitemap')) {
    const { selectedUrls } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedUrls',
        message: 'Select URLs to audit:',
        choices: urls.map((u) => {
          try {
            const parsed = new URL(u);
            return {
              name: parsed.pathname || '/',
              value: u,
              checked: true,
            };
          } catch {
            return { name: u, value: u, checked: true };
          }
        }),
        default: urls,
      },
    ]);
    urls = selectedUrls;
  }

  if (urls.length === 0) {
    log.error('Error: No URLs selected.');
    process.exit(1);
  }

  const timestamp = getTimestamp();
  const formFactorDisplay = runBoth ? 'All (Desktop + Mobile)' : formFactor;
  const categoriesLabel = categories.length === categoriesList.length ? 'All' : categories.join(', ');
  const reportDir = path.join(OUTPUT_DIR, 'lighthouse', timestamp);
  const maxLen = 36;
  const truncate = (s: string) => (s.length > maxLen ? `...${s.slice(-(maxLen - 3))}` : s);

  logBox('Lighthouse Audit', {
    'Form factor': formFactorDisplay,
    Categories: categoriesLabel,
    Output: outputTypes.join(','),
    URLs: urls.length,
    'Report dir': truncate(reportDir),
  });

  fs.mkdirSync(reportDir, { recursive: true });

  const formFactorsToRun = runBoth ? ['desktop', 'mobile'] : [formFactor];

  interface Task {
    url: string;
    ff: string;
    outputPath: string;
    args: string[];
  }

  const tasks: Task[] = [];
  for (const url of urls) {
    for (const ff of formFactorsToRun) {
      const urlSlug = slugify(url);
      const ffDir = path.join(reportDir, ff);
      fs.mkdirSync(ffDir, { recursive: true });
      const outputPath = path.join(ffDir, urlSlug).replace(/\\/g, '/');
      const args = buildArgs(ff, categories, outputTypes, outputPath, false, url, cliArgs);
      tasks.push({ url, ff, outputPath, args });
    }
  }

  if (view && tasks.length > 0) {
    tasks.at(-1)?.args.push('--view');
  }

  const totalRuns = tasks.length;
  const pool = async (concurrency: number) => {
    let next = 0;
    const run = async () => {
      while (next < tasks.length) {
        const i = next++;
        const { url, ff, outputPath, args } = tasks[i];
        await runLighthouse(url, args, `[${i + 1}/${totalRuns}] ${ff}`, outputPath, outputTypes);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, run));
  };

  await pool(1);

  const scores = parseScores(reportDir);

  if (Object.keys(scores).length > 0) {
    log.info('\n┌────────────────────────────────────────┐');
    log.info('│         Scores Summary                  │');
    log.info('├────────────────────────────────────────┤');

    const pages = [...new Set(Object.keys(scores).map((k) => k.replace(/-desktop|-mobile$/, '')))];
    const formFactors = runBoth ? ['desktop', 'mobile'] : [formFactor];

    for (const page of pages) {
      log.info(`│  ${page}`);
      for (const ff of formFactors) {
        const key = runBoth ? `${page}-${ff}` : page;
        const pageScore = scores[key];
        if (pageScore) {
          const ffLabel = runBoth ? `[${ff}]` : '';
          for (const [cat, score] of Object.entries(pageScore)) {
            if (cat === 'formFactor') continue;
            const color = getScoreColor(score);
            log.info(`│    ${ffLabel} ${color}${score}${'\x1b[0m'} ${cat}`);
          }
        }
      }
    }

    log.info('└────────────────────────────────────────┘');
  }

  log.success('\nDone: Lighthouse audit complete');
  log.info(`Reports: ${reportDir}/`);

  const { openReport } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'openReport',
      message: 'Open report folder?',
      default: false,
    },
  ]);

  if (openReport) {
    const absolutePath = path.resolve(reportDir);
    const platform = process.platform;
    const cmd = platform === 'win32' ? 'explorer' : platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(cmd, [absolutePath], { stdio: 'ignore' }).on('error', () => {});
  }
};

setupSigintHandler();
wrapMainError(main);
