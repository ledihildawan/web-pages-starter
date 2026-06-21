import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { log, logBox } from '@core/utils/logger';
import { setupSigintHandler, wrapMainError } from '@core/utils/signal-handler';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import inquirer from 'inquirer';
import { DOMParser } from 'linkedom';

const PREVIEW_URL_FILE = lookup('@public', '.preview-url.json');
const OUTPUT_DIR = env.LIGHTHOUSE_OUTPUT_DIR;

interface PreviewData {
  url: string;
  timestamp: number;
}

async function getPreviewUrl(): Promise<string | null> {
  if (!fs.existsSync(PREVIEW_URL_FILE)) return null;
  try {
    const content = fs.readFileSync(PREVIEW_URL_FILE, 'utf-8');
    const data = JSON.parse(content) as PreviewData;
    const maxAge = 2 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) return null;
    return data.url;
  } catch {
    return null;
  }
}

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

const runLighthouse = (url: string, args: string[], label: string) => {
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
        resolve();
      } else {
        if (stderr) process.stderr.write(stderr);
        reject(new Error(`Lighthouse exited with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
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

const main = async () => {
  const cliArgs = process.argv.slice(2);
  const help = cliArgs.includes('--help');

  if (help) {
    log.info(`
Lighthouse Audit Tool

Usage:
  bun run cli → Lighthouse (interactive)
  bun ./packages/cli/tools/lighthouse.ts [options]

Options:
  --mobile        Use mobile form factor
  --both          Run both desktop and mobile
  --all           Audit all categories
  --only-cats     Specific categories (e.g., --only-cats accessibility,seo)
  --output        Output formats (e.g., --output html,json)
  --url <path>    Audit specific URL path (e.g., --url /about)
  --no-sitemap    Audit base URL only
  --ngrok         Add ngrok-skip-browser-warning header
  --no-throttle   Disable CPU/network throttling
  --view          Open report in browser after audit
  --help          Show this help message
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
  ];

  let categories: string[] = [];
  let outputTypes: string[] = [];

  const allCatsFlag = cliArgs.includes('--all');
  const onlyCatsFlag = cliArgs.includes('--only-cats');

  if (onlyCatsFlag) {
    const catsIndex = cliArgs.indexOf('--only-cats');
    categories = cliArgs[catsIndex + 1]?.split(',').map((c) => c.trim()) ?? [];
  } else if (allCatsFlag) {
    categories = categoriesList.map((c) => c.value);
  }

  if (outputTypes.length === 0) {
    outputTypes = ['html', 'json'];
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
        validate: (answer: string[]) => (answer.length > 0 ? true : 'Select at least one category'),
      },
    ]);
    categories = selectedCategories;
  }

  const baseIdx = cliArgs.indexOf('--base');
  let baseUrl: string;

  if (baseIdx !== -1 && cliArgs[baseIdx + 1]) {
    baseUrl = cliArgs[baseIdx + 1];
  } else {
    const previewUrl = await getPreviewUrl();
    if (!previewUrl) {
      log.error('Preview server not running. Start with bun run preview first.');
      process.exit(1);
    }
    baseUrl = previewUrl;
  }

  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  let urls: string[] = [];

  if (cliArgs.includes('--url')) {
    const urlIndex = cliArgs.indexOf('--url');
    const urlPath = cliArgs[urlIndex + 1];
    if (urlPath) {
      urls = [`${base}${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`];
    }
  } else if (!cliArgs.includes('--no-sitemap')) {
    try {
      const sitemapXml = await fetchSitemap(base, getExtraHeaders(base, cliArgs));
      urls = parseSitemap(sitemapXml).map((u) => {
        try {
          const parsed = new URL(u);
          return `${base}${parsed.pathname}`;
        } catch {
          return u;
        }
      });
    } catch (err) {
      log.warn(`Warning: Could not fetch sitemap — ${(err as Error).message}`);
      urls = [baseUrl];
    }
  } else {
    urls = [baseUrl];
  }

  if (urls.length > 1) {
    const { selectedUrls } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedUrls',
        message: 'Select URLs to audit:',
        choices: urls.map((u) => {
          try {
            const parsed = new URL(u);
            return { name: parsed.pathname || '/', value: u, checked: true };
          } catch {
            return { name: u, value: u, checked: true };
          }
        }),
      },
    ]);
    urls = selectedUrls;
  }

  if (urls.length === 0) {
    log.error('Error: No URLs selected.');
    process.exit(1);
  }

  const timestamp = getTimestamp();
  const reportDir = path.join(OUTPUT_DIR, 'lighthouse', timestamp);

  logBox('Lighthouse Audit', {
    'Form factor': runBoth ? 'All' : formFactor,
    Categories: categories.join(', '),
    Output: outputTypes.join(','),
    URLs: urls.length,
  });

  fs.mkdirSync(reportDir, { recursive: true });

  const formFactorsToRun = runBoth ? ['desktop', 'mobile'] : [formFactor];

  const tasks: { url: string; ff: string; outputPath: string; args: string[] }[] = [];
  for (const url of urls) {
    for (const ff of formFactorsToRun) {
      const urlSlug = slugify(url);
      const ffDir = path.join(reportDir, ff);
      fs.mkdirSync(ffDir, { recursive: true });
      const outputPath = path.join(ffDir, urlSlug).replace(/\\/g, '/');
      const args = [`--output=${outputTypes.join(',')}`, '--quiet', '--no-sandbox', '--disable-dev-shm-usage'];
      const headers = getExtraHeaders(url, cliArgs);
      if (headers) args.push('--extra-headers', headers);
      if (ff === 'mobile') args.push('--form-factor=mobile');
      else args.push('--preset=desktop');
      args.push('--only-categories', categories.join(','));
      args.push('--output-path', outputPath);
      tasks.push({ url, ff, outputPath, args });
    }
  }

  for (const { url, ff, args } of tasks) {
    await runLighthouse(url, args, `[${tasks.indexOf({ url, ff, outputPath: '', args })}/${tasks.length}] ${ff}`);
  }

  log.success('\nDone: Lighthouse audit complete');
  log.info(`Reports: ${reportDir}/`);
};

setupSigintHandler();
wrapMainError(main);
