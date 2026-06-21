import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { log } from '@core/utils/logger';
import { setupSigintHandler, wrapMainError } from '@core/utils/signal-handler';
import { lookup } from '@generated/paths';
import inquirer from 'inquirer';

const CLI_DIR = path.resolve('packages/cli');
const I18N_CLI_DIR = path.resolve('packages/i18n/cli');
const PAGE_SYSTEM_CLI_DIR = path.resolve('packages/page-system/cli');

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

type ToolAction = () => undefined | Promise<unknown>;

interface Tool {
  name: string;
  description: string;
  action: ToolAction;
}

const tools: Tool[] = [
  {
    name: 'Dev',
    description: 'Start development server with hot reload',
    action: () => runBunScript('dev'),
  },
  {
    name: 'Build',
    description: 'Build production bundle with optimizations',
    action: async () => {
      const { buildType } = await inquirer.prompt<{ buildType: string }>([
        {
          type: 'select',
          name: 'buildType',
          message: 'Select build type:',
          choices: [
            { name: 'Production (minified)', value: 'build' },
            { name: 'Pretty HTML (CMS porting)', value: 'build -- --pretty' },
            { name: 'Debug (no minify)', value: 'build -- --debug' },
          ],
        },
      ]);
      const [script, ...args] = buildType.split(' ');
      await runBunScript(script, ...args);
    },
  },
  {
    name: 'Preview',
    description: 'Build and serve via tunnel',
    action: () => runBunScript('preview'),
  },
  {
    name: 'Serve',
    description: 'Serve production build locally',
    action: async () => {
      const distPath = lookup('@dist');
      if (!fs.existsSync(distPath)) {
        log.distNotFound();
        const { choice } = await inquirer.prompt<{ choice: string }>([
          {
            type: 'select',
            name: 'choice',
            message: 'Select action:',
            choices: [
              { name: 'Build first, then serve', value: 'build' },
              { name: 'Cancel', value: 'cancel' },
            ],
          },
        ]);
        if (choice === 'build') {
          await runBunScript('build');
        } else {
          log.cancelled();
          return;
        }
      }
      await runBunScript('serve');
    },
  },
  {
    name: 'Check Parity',
    description: 'Verify translation key parity across locales',
    action: () => runTool('check-parity'),
  },
  {
    name: 'Generate Env',
    description: 'Regenerate env schema from .env files',
    action: () => runTool('generate-env'),
  },
  {
    name: 'Generate Types',
    description: 'Regenerate i18n TypeScript types from locale JSON',
    action: () => runTool('generate-types'),
  },
  {
    name: 'Sync System Pages',
    description: 'Rename system page folders to locale-dependent slugs',
    action: () => runTool('sync-system-pages'),
  },
  {
    name: 'Fetch Rates',
    description: 'Fetch and cache latest exchange rates',
    action: async () => {
      const { force } = await inquirer.prompt<{ force: boolean }>([
        {
          type: 'confirm',
          name: 'force',
          message: 'Force refresh (ignore cache)?',
          default: false,
        },
      ]);
      await runTool('fetch-exchange-rates', force ? ['--force'] : []);
    },
  },
  {
    name: 'Subset Fonts',
    description: 'Generate subsetted font files for active locales',
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
  {
    name: 'Fonts CSS',
    description: 'Generate fonts CSS with preloaded subsets',
    action: async () => {
      const { force } = await inquirer.prompt<{ force: boolean }>([
        {
          type: 'confirm',
          name: 'force',
          message: 'Force regenerate (ignore cache)?',
          default: false,
        },
      ]);
      await runTool('fonts-css', force ? ['--force'] : []);
    },
  },
  {
    name: 'Compress Assets',
    description: 'Compress HTML/CSS/JS with Brotli and Gzip',
    action: async () => {
      const { force } = await inquirer.prompt<{ force: boolean }>([
        {
          type: 'confirm',
          name: 'force',
          message: 'Force recompress (ignore cache)?',
          default: false,
        },
      ]);
      await runTool('compress', force ? ['--force'] : []);
    },
  },
  {
    name: 'Generate Page',
    description: 'Scaffold new page with translation files',
    action: async () => {
      const { pageName } = await inquirer.prompt<{ pageName: string }>([
        {
          type: 'input',
          name: 'pageName',
          message: 'Enter page name:',
          validate: (input: string) => (input.trim().length > 0 ? true : 'Page name is required'),
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
  {
    name: 'Sync Locales',
    description: 'Synchronize locale files from default',
    action: () => runTool('sync-locales'),
  },
  {
    name: 'Test',
    description: 'Run unit tests with optional coverage',
    action: async () => {
      const { testType } = await inquirer.prompt<{ testType: string }>([
        {
          type: 'select',
          name: 'testType',
          message: 'Select test mode:',
          choices: [
            { name: 'Run tests', value: 'run' },
            { name: 'Run with coverage', value: 'coverage' },
            { name: 'Watch mode', value: 'watch' },
          ],
        },
      ]);
      const args = testType === 'coverage' ? ['--coverage'] : testType === 'watch' ? ['--watch'] : [];
      await runBunScript('test', ...args);
    },
  },
  {
    name: 'Clean Cache',
    description: 'Clear all caches: pipeline, rsbuild, dist, assets',
    action: () => runTool('clean-cache'),
  },
  {
    name: 'Full Reset',
    description: 'Remove dependencies and reinstall',
    action: async () => {
      log.info('This will DELETE:');
      log.info('   - node_modules/');
      log.info('   - dist/');
      log.info('   - bun.lock\n');

      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Type "yes" to confirm deletion:',
          default: false,
        },
      ]);

      if (!confirm) {
        log.info('Cancelled.');
        return;
      }

      const { doubleConfirm } = await inquirer.prompt<{ doubleConfirm: string }>([
        {
          type: 'input',
          name: 'doubleConfirm',
          message: 'Re-type "yes" to confirm:',
          default: '',
        },
      ]);

      if (doubleConfirm.toLowerCase() !== 'yes') {
        log.info('Cancelled.');
        return;
      }

      const dirs = ['node_modules', 'dist', 'bun.lock'];
      for (const dir of dirs) {
        try {
          fs.rmSync(lookup('@', dir), { recursive: true, force: true });
          log.info(`Removed ${dir}`);
        } catch {}
      }
      log.info('Running bun install...');
      const proc = spawn('bun', ['install'], {
        stdio: 'inherit',
        shell: false,
        cwd: process.cwd(),
      });
      return new Promise<void>((resolve) => proc.on('close', () => resolve()));
    },
  },
];

const main = async (): Promise<void> => {
  console.clear();
  log.header('Web Pages Starter CLI');

  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: 'rawlist',
      name: 'action',
      message: 'What do you want to do?',
      choices: tools.map((t) => `${t.name} - ${t.description}`),
    },
  ]);

  const tool = tools.find((t) => `${t.name} - ${t.description}` === action);
  if (!tool) return;

  log.toolStarted(tool.name);
  await tool.action();
};

setupSigintHandler();
wrapMainError(main);
