import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import { config } from 'dotenv';
import { DOMParser } from 'linkedom';
import inquirer from 'inquirer';

config({ path: '.env.development' });

const BASE_URL = process.env.TUNNEL_URL || process.env.SITE_URL || 'http://localhost:8888';
const IS_NGROK = BASE_URL.includes('ngrok');
const EXTRA_HEADERS = IS_NGROK ? JSON.stringify({ 'ngrok-skip-browser-warning': '1' }) : null;
const OUTPUT_DIR = './report';

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
};

const fetchSitemap = async (url) => {
  const sitemapUrl = url.endsWith('/') ? `${url}sitemap.xml` : `${url}/sitemap.xml`;

  const res = await fetch(sitemapUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status}`);
  }
  return res.text();
};

const parseSitemap = (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const urls = doc.querySelectorAll('url loc');
  return Array.from(urls).map((el) => el.textContent.trim());
};

const runLighthouse = (url, args, label) => {
  return new Promise((resolve) => {
    console.log(`\n${label} Running lighthouse for ${url}...`);
    const proc = spawn('bunx', ['lighthouse', url, ...args], {
      stdio: 'inherit',
      shell: false,
    });

    proc.on('close', (code) => {
      resolve(code === 0 || code === 1 ? 0 : code);
    });
  });
};

const buildArgs = (formFactor, categories, outputTypes, outputPath, view) => {
  const args = [`--output=${outputTypes.join(',')}`, '--quiet', '--quiet-throttle'];

  if (EXTRA_HEADERS) {
    args.push('--extra-headers', EXTRA_HEADERS);
  }

  if (formFactor === 'desktop') {
    args.push('--preset=desktop');
  } else {
    args.push('--form-factor=mobile');
  }

  if (categories && categories.length > 0) {
    args.push('--only-categories', categories.join(','));
  }

  args.push('--output-path', outputPath);

  if (view) {
    args.push('--view');
  }

  return args;
};

const slugify = (url) => {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/\/$/, '').replace(/^\//, '');
    return pathname.replace(/\//g, '-') || 'index';
  } catch {
    return url.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/^-/, '');
  }
};

const getScoreColor = (score) => {
  if (score >= 90) return '\x1b[32m';
  if (score >= 50) return '\x1b[33m';
  return '\x1b[31m';
};

const parseScores = (reportDir) => {
  const scores: Record<string, Record<string, number>> = {};

  if (!fs.existsSync(reportDir)) return scores;

  const jsonFiles = fs.readdirSync(reportDir).filter((f) => f.endsWith('.report.json'));

  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(path.join(reportDir, file), 'utf-8');
      const data = JSON.parse(content);
      const pageName = file.replace('.report.json', '');

      scores[pageName] = {};
      if (data.categories) {
        for (const [key, cat] of Object.entries(data.categories)) {
          scores[pageName][key] = Math.round((cat as any).score * 100);
        }
      }
      if (data.formFactor) {
        scores[pageName].formFactor = data.formFactor;
      }
    } catch {}
  }

  return scores;
};

const main = async () => {
  const cliArgs = process.argv.slice(2);
  const view = cliArgs.includes('--view');
  const help = cliArgs.includes('--help');

  if (help) {
    console.log(`
📊 Lighthouse Audit Tool

Usage:
  bun run cli → Lighthouse (interactive)
  bun run tools/lighthouse.ts [options]

Options:
  --mobile        Use mobile form factor
  --both          Run both desktop and mobile
  --all           Audit all categories
  --only-cats     Specific categories (e.g., --only-cats performance,accessibility)
  --output        Output formats (e.g., --output html,json)
  --url <path>    Audit specific URL path (e.g., --url /about)
  --no-sitemap    Audit base URL only
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
    { name: 'PWA', value: 'pwa', checked: true },
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

  if (cliArgs.includes('--url')) {
    const urlIndex = cliArgs.indexOf('--url');
    const urlPath = cliArgs[urlIndex + 1];
    if (!urlPath) {
      console.error('Error: --url requires a path argument');
      process.exit(1);
    }
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    urls = [`${base}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`];
  } else if (cliArgs.includes('--no-sitemap')) {
    urls = [BASE_URL];
  } else {
    try {
      const sitemapXml = await fetchSitemap(BASE_URL);
      urls = parseSitemap(sitemapXml);
    } catch (err) {
      console.warn(`Could not fetch sitemap: ${err.message}`);
      urls = [BASE_URL];
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
    console.error('No URLs selected.');
    process.exit(1);
  }

  const timestamp = getTimestamp();
  const formFactorDisplay = runBoth ? 'All (Desktop + Mobile)' : formFactor;
  const categoriesLabel = categories.length === categoriesList.length ? 'All' : categories.join(', ');
  const label = categories.length === categoriesList.length ? `all-${runBoth ? 'both' : formFactor}` : (runBoth ? `both-${categories.length}cats` : `${formFactor}-${categories.length}cats`);
  const reportDir = path.join(OUTPUT_DIR, `lighthouse-${timestamp}-${label}`);

  console.log('\n┌────────────────────────────────────────┐');
  console.log('│         📊 Lighthouse Audit            │');
  console.log('├────────────────────────────────────────┤');
  console.log(`│  Form factor:  ${formFactorDisplay.padEnd(24)}│`);
  console.log(`│  Categories:   ${categoriesLabel.padEnd(24)}│`);
  console.log(`│  Output:       ${outputTypes.join(',').padEnd(24)}│`);
  console.log(`│  URLs:         ${String(urls.length).padEnd(24)}│`);
  console.log(`│  Report dir:   ${reportDir.slice(-24).padEnd(24)}│`);
  console.log('└────────────────────────────────────────┘');

  fs.mkdirSync(reportDir, { recursive: true });

  const formFactorsToRun = runBoth ? ['desktop', 'mobile'] : [formFactor];
  let index = 0;
  const totalRuns = urls.length * formFactorsToRun.length;

  for (const url of urls) {
    for (const ff of formFactorsToRun) {
      index++;
      const urlSlug = slugify(url);
      const outputPath = path.join(reportDir, `${urlSlug}-${ff}`).replace(/\\/g, '/');
      const args = buildArgs(ff, categories, outputTypes, outputPath, view && ff === formFactorsToRun[formFactorsToRun.length - 1] && url === urls[urls.length - 1]);

      await runLighthouse(url, args, `[${index}/${totalRuns}] ${ff}`);
    }
  }

  const scores = parseScores(reportDir);

  if (Object.keys(scores).length > 0) {
    console.log('\n┌────────────────────────────────────────┐');
    console.log('│            📈 Scores Summary            │');
    console.log('├────────────────────────────────────────┤');

    const pages = [...new Set(Object.keys(scores).map((k) => k.replace(/-desktop|-mobile$/, '')))];
    const formFactors = runBoth ? ['desktop', 'mobile'] : [formFactor];

    for (const page of pages) {
      console.log(`│  ${page}`);
      for (const ff of formFactors) {
        const key = runBoth ? `${page}-${ff}` : page;
        const pageScore = scores[key];
        if (pageScore) {
          const ffLabel = runBoth ? `[${ff}]` : '';
          for (const [cat, score] of Object.entries(pageScore)) {
            if (cat === 'formFactor') continue;
            const color = getScoreColor(score);
            console.log(`│    ${ffLabel} ${color}${score}${'\x1b[0m'} ${cat}`);
          }
        }
      }
    }

    console.log('└────────────────────────────────────────┘');
  }

  console.log('\n✅ Lighthouse audit complete!');
  console.log(`📁 Reports: ${reportDir}/`);

  if (Object.keys(scores).length > 0) {
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
      spawn('explorer', [absolutePath], { stdio: 'ignore' });
    }
  }
};

main();