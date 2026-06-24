import { writeFileSync } from 'node:fs';
import { join } from 'pathe';
import process from 'node:process';
import { log, logBox } from '@web-pages-starter/core/logger';
import { setupSigintHandler, wrapMainError } from '@web-pages-starter/core/signal-handler';
import { env } from '@generated/env';
import { isExpired, loadPreviewUrl } from '@shared/utils/preview-url';
import inquirer from 'inquirer';
import {
  CATEGORIES_ALL,
  DEFAULT_FORM_FACTOR,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_OUTPUTS,
  DEFAULT_THROTTLING_METHOD,
} from './constants';
import { formatCsvHeader, formatCsvLine, formatSummaryTable } from './formatter';
import { cleanupOldReports, runAudit } from './runner';
import { scanPagesFromDist } from './scanner';

const CLI_OPTIONS = {
  '--help': 'Show this help message',
  '--form-factor': 'desktop | mobile | both (default: interactive)',
  '--categories': 'Comma-separated categories (default: all stable)',
  '--output': 'html | json | csv (default: html,json)',
  '--json': 'Shortcut for --output=json (for CI/CD)',
  '--view': 'Open report in browser (default: true)',
  '--no-view': "Don't open report",
  '--dist': 'Path to dist folder',
  '--throttling-method': 'devtools | provided | simulate (default: devtools)',
  '--quiet': 'Suppress stdout output (for CI)',
  '--retry': 'Retry failed URLs up to 3 times (default: 1)',
  '--list': 'List URLs only, do not audit',
  '--clean': 'Clean old reports',
} as const;

function printHelp(): void {
  log.info(`
  Lighthouse Audit Tool
  ${'─'.repeat(50)}

  Usage:
    bun run cli          Interactive menu (select Lighthouse)
    bun ./packages/cli/tools/lighthouse/index.ts [options]

  Options:
${Object.entries(CLI_OPTIONS)
  .map(([opt, desc]) => `    ${opt.padEnd(22)} ${desc}`)
  .join('\n')}

  Categories:
${CATEGORIES_ALL.map((c) => {
  const cat = c as { value: string; experimental?: boolean; name: string };
  const experimental = cat.experimental ? ' (experimental)' : '';
  return `    ${cat.value.padEnd(20)} ${cat.name}${experimental}`;
}).join('\n')}

  Examples:
    bun ./packages/cli/tools/lighthouse/index.ts --form-factor=desktop --categories=performance,accessibility
    bun ./packages/cli/tools/lighthouse/index.ts --list --dist=./dist
    bun ./packages/cli/tools/lighthouse/index.ts --clean
    bun ./packages/cli/tools/lighthouse/index.ts --json --quiet --retry=3
  `);
}

interface CliArgs {
  help: boolean;
  formFactor: 'desktop' | 'mobile' | 'both' | null;
  categories: string[] | null;
  outputs: string[];
  view: boolean;
  dist: string | null;
  throttlingMethod: string | null;
  quiet: boolean;
  retry: number;
  list: boolean;
  clean: boolean;
  baseUrl: string | null;
  urls: string[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  const result: CliArgs = {
    help: false,
    formFactor: null,
    categories: null,
    outputs: [...DEFAULT_OUTPUTS],
    view: true,
    dist: null,
    throttlingMethod: null,
    quiet: false,
    retry: 1,
    list: false,
    clean: false,
    baseUrl: null,
    urls: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      return result;
    }

    if (arg === '--form-factor') {
      const val = args[++i];
      if (val === 'desktop' || val === 'mobile' || val === 'both') {
        result.formFactor = val;
      }
      continue;
    }

    if (arg === '--categories') {
      const val = args[++i];
      if (val) {
        result.categories = val.split(',').map((c) => c.trim());
      }
      continue;
    }

    if (arg === '--output') {
      const val = args[++i];
      if (val) {
        result.outputs = val.split(',').map((c) => c.trim());
      }
      continue;
    }

    if (arg === '--view') {
      result.view = true;
      continue;
    }

    if (arg === '--no-view') {
      result.view = false;
      continue;
    }

    if (arg === '--dist') {
      result.dist = args[++i] || null;
      continue;
    }

    if (arg === '--throttling-method') {
      result.throttlingMethod = args[++i] || null;
      continue;
    }

    if (arg === '--json') {
      result.outputs = ['json'];
      continue;
    }

    if (arg === '--quiet' || arg === '-q') {
      result.quiet = true;
      continue;
    }

    if (arg === '--retry') {
      const val = args[++i];
      const retryCount = parseInt(val || '3', 10);
      result.retry = isNaN(retryCount) ? 1 : Math.min(Math.max(retryCount, 1), 5);
      continue;
    }

    if (arg === '--list') {
      result.list = true;
      continue;
    }

    if (arg === '--clean') {
      result.clean = true;
      continue;
    }

    if (arg === '--base') {
      result.baseUrl = args[++i] || null;
      continue;
    }

    if (arg === '--url') {
      const url = args[++i];
      if (url) {
        result.urls.push(url);
      }
    }
  }

  return result;
}

async function interactiveFormFactor(): Promise<'desktop' | 'mobile' | 'both'> {
  const { selected } = await inquirer.prompt<{ selected: 'desktop' | 'mobile' | 'both' }>([
    {
      type: 'select',
      name: 'selected',
      message: 'Select form factor:',
      choices: [
        { name: 'Desktop', value: 'desktop' },
        { name: 'Mobile', value: 'mobile' },
        { name: 'All (Desktop + Mobile)', value: 'both' },
      ],
      default: DEFAULT_FORM_FACTOR as 'desktop',
    },
  ]);
  return selected;
}

async function interactiveCategories(): Promise<string[]> {
  const choices = CATEGORIES_ALL.map((c) => {
    const cat = c as { value: string; experimental?: boolean; name: string; checked: boolean };
    return {
      name: cat.experimental ? `${cat.name} (experimental)` : cat.name,
      value: cat.value,
      checked: cat.checked,
    };
  });

  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select categories to audit:',
      choices,
      validate: (answer: string[]) => (answer.length > 0 ? true : 'Select at least one category'),
    },
  ]);

  return selected;
}

async function interactiveUrlSelection(pages: { path: string; url: string }[], baseUrl: string): Promise<string[]> {
  if (pages.length <= 1) {
    return pages.map((p) => `${baseUrl}${p.url}`);
  }

  const choices = pages.map((p) => ({
    name: p.path === 'index' ? '/' : `/${p.path}`,
    value: `${baseUrl}${p.url}`,
    checked: true,
  }));

  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select URLs to audit:',
      choices,
    },
  ]);

  return selected;
}

async function getBaseUrl(cliBase?: string | null): Promise<string> {
  if (cliBase) {
    return cliBase;
  }

  const saved = await loadPreviewUrl();
  if (!saved || isExpired(saved)) {
    log.error('Preview server not running or URL expired. Start with bun run preview first.');
    process.exit(1);
  }

  return saved.url;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.clean) {
    cleanupOldReports(env.LIGHTHOUSE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR);
    process.exit(0);
  }

  const outputDir = env.LIGHTHOUSE_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;

  const formFactor = args.formFactor ?? (await interactiveFormFactor());

  let categories = args.categories;
  if (!categories) {
    categories = await interactiveCategories();
  }

  if (categories.includes('agentic')) {
    log.warn('\n⚠️  Agentic Browsing is experimental and requires Chrome 150+.\n');
  }

  const baseUrl = await getBaseUrl(args.baseUrl);

  const pages = scanPagesFromDist(args.dist || undefined);
  const auditUrls =
    args.urls.length > 0
      ? args.urls.map((u) => `${baseUrl}${u.startsWith('/') ? u : `/${u}`}`)
      : await interactiveUrlSelection(pages, baseUrl);

  if (args.list) {
    log.info('\nDiscovered URLs:\n');
    for (const url of auditUrls) {
      log.info(`  ${url}`);
    }
    log.info('');
    process.exit(0);
  }

  if (auditUrls.length === 0) {
    log.error('No URLs to audit.');
    process.exit(1);
  }

  cleanupOldReports(outputDir);

  if (!args.quiet) {
    logBox('Lighthouse Audit', {
      'Form factor': formFactor === 'both' ? 'All' : formFactor,
      Categories: categories.join(', '),
      Output: args.outputs.join(','),
      URLs: auditUrls.length,
      Retry: args.retry > 1 ? `${args.retry}x` : '1x',
    });
  }

  const result = await runAudit({
    urls: auditUrls,
    formFactor,
    categories,
    outputs: args.outputs,
    outputDir,
    throttlingMethod: args.throttlingMethod || DEFAULT_THROTTLING_METHOD,
    view: args.view,
    quiet: args.quiet,
    retry: args.retry,
  });

  if (result.results.length > 0 && !args.quiet) {
    console.log(`\n${formatSummaryTable(result.results, categories)}`);

    if (args.outputs.includes('csv')) {
      const csvPath = join(result.reportDir, 'summary.csv');
      const csvLines = [formatCsvHeader(categories), ...result.results.map((r) => formatCsvLine(r))].join('\n');
      writeFileSync(csvPath, csvLines);
      log.info(`\nCSV: ${csvPath}`);
    }
  }

  if (result.success) {
    if (!args.quiet) {
      log.success('\nDone: Lighthouse audit complete');
      log.info(`Reports: ${result.reportDir}/`);
    }
  } else {
    log.error('\nAudit completed with errors.');
    process.exit(1);
  }
}

setupSigintHandler();
wrapMainError(main);
