import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { log } from '@core/utils/logger';
import { setupSigintHandler, wrapMainError } from '@core/utils/signal-handler';
import { lookup } from '@generated/paths';
import { Separator } from '@inquirer/prompts';
import inquirer from 'inquirer';

const CLI_DIR = path.resolve('packages/cli');
const I18N_CLI_DIR = path.resolve('packages/i18n/cli');
const PAGE_SYSTEM_CLI_DIR = path.resolve('packages/page-system/cli');

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  log.info(`
Interactive CLI menu for Web Pages Starter.

Usage:
  bun run cli [options]

Options:
  --help, -h    Show this help message

Menu sections:
  Develop        Dev server, test
  Build          Production/Pretty/Debug, Preview, Serve
  Pages          Generate Page, Delete Page
  i18n           Check Parity, Sync Locales
  Performance    Lighthouse audit
  Utilities      Subset Fonts

For direct tool access:
  bun ./packages/<pkg>/cli/<tool>.ts --help
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
      path.join(CLI_DIR, `generators/${name}.ts`),
      path.join(CLI_DIR, `scripts/${name}.ts`),
      path.join(CLI_DIR, `tools/${name}.ts`),
      path.join(I18N_CLI_DIR, `${name}.ts`),
      path.join(PAGE_SYSTEM_CLI_DIR, `${name}.ts`),
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

type ToolAction = () => unknown;

interface Tool {
  name: string;
  description: string;
  action: ToolAction;
}

interface Section {
  key: string;
  title: string;
  items: Tool[];
}

// ─── Banner ────────────────────────────────────────────────────────────────────

const BANNER = `
╔══════════════════════════════════════════════════╗
║           Web Pages Starter CLI                   ║
╚══════════════════════════════════════════════════╝`;

// ─── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    key: 'develop',
    title: 'Develop',
    items: [
      {
        name: 'Dev Server',
        description: 'Start dev server with hot reload',
        action: () => runBunScript('dev'),
      },
      {
        name: 'Test',
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
    ],
  },
  {
    key: 'build',
    title: 'Build',
    items: [
      {
        name: 'Production',
        description: 'Minified production build',
        action: async () => {
          const { variant } = await inquirer.prompt<{ variant: string }>([
            {
              type: 'select',
              name: 'variant',
              message: 'Select build variant:',
              choices: [
                { name: 'Production  Minified', value: 'build' },
                { name: 'Pretty  Clean HTML (CMS porting)', value: 'pretty' },
                { name: 'Debug  No minification', value: 'debug' },
              ],
            },
          ]);
          await runBunScript(
            'build',
            ...(variant === 'pretty' ? ['--', '--pretty'] : variant === 'debug' ? ['--', '--debug'] : []),
          );
        },
      },
      {
        name: 'Preview Tunnel',
        description: 'Build + tunnel preview (ngrok / cloudflared)',
        action: () => runBunScript('preview'),
      },
      {
        name: 'Serve Dist',
        description: 'Serve production dist locally',
        action: async () => {
          const distPath = lookup('@dist');
          if (!fs.existsSync(distPath)) {
            log.warn('dist/ not found. Building first...');
            await runBunScript('build');
          }
          await runBunScript('serve');
        },
      },
    ],
  },
  {
    key: 'pages',
    title: 'Pages',
    items: [
      {
        name: 'Generate Page',
        description: 'Scaffold a new page with locale files',
        action: async () => {
          const { pageName } = await inquirer.prompt<{ pageName: string }>([
            {
              type: 'input',
              name: 'pageName',
              message: 'Enter page path:',
              hint: 'e.g. pricing  or  services/web',
              validate: (input: string) => (input.trim().length > 0 ? true : 'Page path is required'),
            },
          ]);
          await runTool('generate-page', [pageName.trim()]);
        },
      },
      {
        name: 'Delete Page',
        description: 'Remove a page and its locale files',
        action: () => runTool('delete-page'),
      },
    ],
  },
  {
    key: 'i18n',
    title: 'i18n',
    items: [
      {
        name: 'Check Parity',
        description: 'Verify translation key parity across locales',
        action: () => runTool('check-parity'),
      },
      {
        name: 'Sync Locales',
        description: 'Sync missing locale files from default locale',
        action: () => runTool('sync-locales'),
      },
    ],
  },
  {
    key: 'perf',
    title: 'Performance',
    items: [
      {
        name: 'Lighthouse',
        description: 'Run Lighthouse audit (desktop + mobile, all categories)',
        action: () => runTool('lighthouse'),
      },
    ],
  },
  {
    key: 'utils',
    title: 'Utilities',
    items: [
      {
        name: 'Subset Fonts',
        description: 'Regenerate subsetted font files',
        action: async () => {
          const { force } = await inquirer.prompt<{ force: boolean }>([
            {
              type: 'confirm',
              name: 'force',
              message: 'Force regenerate (ignore cache)?',
              default: false,
            },
          ]);
          await runTool('subset-fonts', force ? ['--force'] : []);
        },
      },
    ],
  },
];

// ─── Menu renderer ─────────────────────────────────────────────────────────────

function printSection(section: Section): void {
  const title = `▸ ${section.title}`;
  const items = section.items.map((item, i) => `  ${i + 1}. ${item.name.padEnd(20)} ${item.description}`);
  console.log(`\n${title}\n${items.join('\n')}\n  B. Back to main menu\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  let exit = false;

  while (!exit) {
    process.stdout.write('\x1b[2J\x1b[H');
    console.log(BANNER);
    log.info('\n  What do you want to do?\n');

    const sectionChoices = SECTIONS.map((s) => ({ name: `  ${s.title.padEnd(14)} →`, value: s.key }));

    const { section } = await inquirer.prompt<{ section: string }>([
      {
        type: 'rawlist',
        name: 'section',
        message: 'Select:',
        choices: [
          ...(sectionChoices as { name: string; value: string }[]),
          new Separator(),
          { name: '  Quit', value: '__quit__' },
        ],
        loop: false,
      },
    ]);

    if (section === '__quit__') {
      exit = true;
      continue;
    }

    const currentSection = SECTIONS.find((s) => s.key === section);
    if (!currentSection) {
      log.error('Error: Unknown section.');
      log.info('\n  Press Enter to continue...');
      await inquirer.prompt<Record<string, unknown>>([{ type: 'input', name: '_', message: '' }]);
      continue;
    }

    // Sub-menu loop
    let back = false;
    while (!back) {
      process.stdout.write('\x1b[2J\x1b[H');
      console.log(BANNER);
      printSection(currentSection);

      const toolChoices = currentSection.items.map((item) => ({
        name: `  ${item.name.padEnd(22)} ${item.description}`,
        value: item.name,
      }));

      const { toolName } = await inquirer.prompt<{ toolName: string }>([
        {
          type: 'rawlist',
          name: 'toolName',
          message: `Select ${currentSection.title} tool:`,
          choices: [
            ...(toolChoices as { name: string; value: string }[]),
            new Separator(),
            { name: '  Back', value: '__back__' },
          ],
          loop: false,
        },
      ]);

      if (toolName === '__back__') {
        back = true;
        break;
      }

      const tool = currentSection.items.find((t) => t.name === toolName);
      if (!tool) {
        log.error(`Error: Unknown tool "${toolName}".`);
        log.info('\n  Press Enter to continue...');
        await inquirer.prompt<Record<string, unknown>>([{ type: 'input', name: '_', message: '' }]);
        back = true;
        break;
      }

      process.stdout.write('\x1b[2J\x1b[H');
      console.log(BANNER);
      log.toolStarted(`${currentSection.title} / ${tool.name}`);

      try {
        await tool.action();
      } catch {
        // failure already logged via log.toolFailed inside runners
      }

      log.info('\n  Press Enter to continue...');
      await inquirer.prompt<Record<string, unknown>>([{ type: 'input', name: '_', message: '' }]);
      back = true;
    }
  }

  process.stdout.write('\x1b[2J\x1b[H');
  console.log(BANNER);
  log.success('\n  Goodbye!\n');
};

setupSigintHandler();
wrapMainError(main);
