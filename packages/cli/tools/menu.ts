import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { join, resolve as patheResolve } from 'pathe';
import { log } from '@web-pages-starter/core/logger';
import { setupSigintHandler, wrapMainError } from '@web-pages-starter/core/signal-handler';
import inquirer from 'inquirer';

const CLI_DIR = patheResolve('packages/cli');
const I18N_CLI_DIR = patheResolve('packages/i18n/cli');
const PAGE_SYSTEM_CLI_DIR = patheResolve('packages/page-system/cli');

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  log.info(`
Web Pages Starter CLI

Usage:
  bun run cli        Interactive menu
  bun run cli -h     Show this help

Direct commands:
  bun run dev
  bun run build [-- --pretty|--debug]
  bun run test [-- --watch|--coverage]
  bun run preview
  bun run serve
`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

// ─── Tool runners ──────────────────────────────────────────────────────────────

const runTool = (name: string, args: string[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    const candidates = [
      join(CLI_DIR, `generators/${name}.ts`),
      join(CLI_DIR, `scripts/${name}.ts`),
      join(CLI_DIR, `tools/${name}.ts`),
      join(CLI_DIR, `tools/${name}/${name}.ts`),
      join(I18N_CLI_DIR, `${name}.ts`),
      join(PAGE_SYSTEM_CLI_DIR, `${name}.ts`),
    ];
    const toolPath = candidates.find((c) => fs.existsSync(c));

    if (!toolPath) {
      reject(new Error(`Tool "${name}" not found`));
      return;
    }

    const proc = spawn('bun', [toolPath, ...args], {
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        log.toolFailed(name, code ?? 1);
        reject(new Error(`${name} failed`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      log.toolSpawnFailed(name, err);
      reject(err);
    });
  });
};

const runBunScript = (name: string, ...extraArgs: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn('bun', ['run', name, ...extraArgs], {
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        log.toolFailed(name, code ?? 1);
        reject(new Error(`${name} failed`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      log.toolSpawnFailed(name, err);
      reject(err);
    });
  });
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type ToolAction = () => Promise<void>;

interface Tool {
  name: string;
  section: string;
  description: string;
  action: ToolAction;
}

// ─── Tools ─────────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'Dev Server',
    section: 'Develop',
    description: 'Start dev server with hot reload',
    action: () => runBunScript('dev'),
  },
  {
    name: 'Test',
    section: 'Develop',
    description: 'Run unit tests',
    action: async () => {
      const { mode } = await inquirer.prompt<{ mode: string }>([
        {
          type: 'select',
          name: 'mode',
          message: 'Select test mode:',
          choices: [
            { name: 'Run tests', value: 'run' },
            { name: 'Run with coverage', value: 'coverage' },
            { name: 'Watch mode', value: 'watch' },
          ],
        },
      ]);
      await runBunScript('test', ...(mode === 'coverage' ? ['--coverage'] : mode === 'watch' ? ['--watch'] : []));
    },
  },
  {
    name: 'Production Build',
    section: 'Build',
    description: 'Minified production build',
    action: () => runBunScript('build'),
  },
  {
    name: 'Pretty Build',
    section: 'Build',
    description: 'Beautified HTML + external CSS for inspection',
    action: () => runBunScript('build', '--', '--pretty'),
  },
  {
    name: 'Debug Build',
    section: 'Build',
    description: 'No minification, source maps enabled',
    action: () => runBunScript('build', '--', '--debug'),
  },
  {
    name: 'Preview Tunnel',
    section: 'Build',
    description: 'Build + tunnel preview (ngrok/cloudflared)',
    action: () => runBunScript('preview'),
  },
  {
    name: 'Serve Dist',
    section: 'Build',
    description: 'Build + serve production dist locally',
    action: async () => {
      log.info('Building production dist...');
      await runBunScript('build');
      await runBunScript('serve');
    },
  },
  {
    name: 'Generate Page',
    section: 'Pages',
    description: 'Scaffold a new page with locale files',
    action: () => runTool('generate-page', ['']),
  },
  {
    name: 'Delete Page',
    section: 'Pages',
    description: 'Remove a page and its locale files',
    action: () => runTool('delete-page'),
  },
  {
    name: 'Check Parity',
    section: 'i18n',
    description: 'Verify translation key parity across locales',
    action: () => runTool('check-parity'),
  },
  {
    name: 'Sync Locales',
    section: 'i18n',
    description: 'Sync missing keys from default locale',
    action: () => runTool('sync-locales'),
  },
  {
    name: 'Lighthouse',
    section: 'Performance',
    description: 'Run Lighthouse audit with --json, --quiet, --retry',
    action: () => runTool('lighthouse'),
  },
  {
    name: 'Subset Fonts',
    section: 'Utilities',
    description: 'Regenerate subsetted font files',
    action: () => runTool('subset-fonts'),
  },
  {
    name: 'Clean Cache',
    section: 'Utilities',
    description: 'Remove temp/pipeline cache',
    action: () => runTool('clean-cache'),
  },
  {
    name: 'Lint',
    section: 'Utilities',
    description: 'Run biome linter',
    action: () => runBunScript('biome', 'ci'),
  },
  {
    name: 'Typecheck',
    section: 'Utilities',
    description: 'Run TypeScript checker',
    action: () => runBunScript('typecheck'),
  },
];

// ─── Banner ────────────────────────────────────────────────────────────────────

const BANNER = `
  Web Pages Starter CLI
  ---------------------`;

// ─── Menu renderer ─────────────────────────────────────────────────────────────

function printMenu(): void {
  console.log(BANNER);
  console.log('\n  What do you want to do?\n');

  let currentSection = '';
  const choices: { name: string; value: number }[] = [];

  TOOLS.forEach((tool, i) => {
    if (tool.section !== currentSection) {
      currentSection = tool.section;
      console.log(`  [ ${currentSection} ]`);
    }
    console.log(`    ${String(i + 1).padStart(2)}. ${tool.name.padEnd(18)} ${tool.description}`);
    choices.push({ name: `${i + 1}`, value: i });
  });

  console.log('\n    Q. Quit\n');
}

async function runToolInteractive(): Promise<void> {
  printMenu();

  const { choice } = await inquirer.prompt<{ choice: string }>([
    {
      type: 'input',
      name: 'choice',
      message: `Choice (1-${TOOLS.length}) or Q:`,
    },
  ]);

  const upper = choice.trim().toUpperCase();
  if (upper === 'Q') {
    console.log('\n  Goodbye!\n');
    return;
  }

  const idx = parseInt(choice, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= TOOLS.length) {
    log.error(`Invalid choice. Enter 1-${TOOLS.length} or Q.`);
    await runToolInteractive();
    return;
  }

  const tool = TOOLS[idx];

  process.stdout.write('\x1b[2J\x1b[H');
  console.log(BANNER);
  log.info(`\n  Running: ${tool.name}\n`);

  try {
    await tool.action();
    log.success('\n  Done!\n');
  } catch {
    // error already logged
  }

  await runToolInteractive();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

setupSigintHandler();
wrapMainError(runToolInteractive);
