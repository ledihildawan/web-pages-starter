#!/usr/bin/env bun
import inquirer from 'inquirer';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const runTool = (script, args = []) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('bun', [path.join(__dirname, `${script}.ts`), ...args], {
      stdio: 'inherit',
      shell: false,
      cwd: ROOT,
    });
    proc.on('close', (code) => resolve(code));
    proc.on('error', reject);
  });
};

const runBunScript = (script) => {
  return new Promise((resolve, reject) => {
    const proc = spawn('bun', ['run', script], {
      stdio: 'inherit',
      shell: false,
      cwd: ROOT,
    });
    proc.on('close', (code) => resolve(code));
    proc.on('error', reject);
  });
};

const cleanCache = () => {
  const dirs = ['node_modules/.cache', '.cache', 'dist'];
  for (const dir of dirs) {
    try {
      fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
    } catch {}
  }
  console.log('✅ Cache cleaned');
};

const tools = [
  {
    name: '🚀 Dev',
    description: 'Start development server',
    action: () => runBunScript('dev'),
  },
  {
    name: '🏗️ Build',
    description: 'Build for production (deployment)',
    action: () => runBunScript('build'),
  },
  {
    name: '📦 Build & Preview',
    description: 'Build with tunnel URL + preview (for Lighthouse)',
    action: () => runBunScript('build:preview'),
  },
  {
    name: '👁️ Preview',
    description: 'Preview production build locally',
    action: () => runBunScript('preview'),
  },
  {
    name: '📄 Generate Page',
    description: 'Create a new page',
    action: async () => {
      const { pageName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'pageName',
          message: 'Enter page name:',
          validate: (input) => (input.trim().length > 0 ? true : 'Page name is required'),
        },
      ]);
      await runTool('generate-page', [pageName.trim()]);
    },
  },
  {
    name: '🌐 Sync Locales',
    description: 'Sync translations across all locales',
    action: () => runTool('sync-locales'),
  },
  {
    name: '💱 Fetch Rates',
    description: 'Fetch latest currency exchange rates',
    action: () => runTool('fetch-exchange-rates'),
  },
  {
    name: '🔍 Check Parity',
    description: 'Verify all locales have same translation keys',
    action: () => runTool('check-locale-parity'),
  },
  {
    name: '📊 Lighthouse',
    description: 'Run Lighthouse performance audit',
    action: () => runTool('lighthouse'),
  },
  {
    name: '⚙️ Generate i18n',
    description: 'Generate TypeScript types for i18n',
    action: () => runTool('generate-i18n'),
  },
  {
    name: '🗺️ Generate Sitemap',
    description: 'Generate sitemap.xml from pages',
    action: () => runTool('generate-sitemap'),
  },
  {
    name: '🧹 Clean Cache',
    description: 'Clear build cache and dist',
    action: () => cleanCache(),
  },
  {
    name: '🗑️ Full Reset',
    description: 'Remove node_modules, dist and reinstall',
    action: async () => {
      console.log('⚠️  This will DELETE:');
      console.log('   • node_modules/');
      console.log('   • dist/');
      console.log('   • bun.lock\n');

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Type "yes" to confirm deletion:',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log('Cancelled.');
        return;
      }

      const { doubleConfirm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'doubleConfirm',
          message: 'Re-type "yes" to confirm:',
          default: '',
        },
      ]);

      if (doubleConfirm.toLowerCase() !== 'yes') {
        console.log('Cancelled.');
        return;
      }

      const dirs = ['node_modules', 'dist', 'bun.lock'];
      for (const dir of dirs) {
        try {
          fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
          console.log(`Removed ${dir}`);
        } catch {}
      }
      console.log('Running bun install...');
      const proc = spawn('bun', ['install'], {
        stdio: 'inherit',
        shell: false,
        cwd: ROOT,
      });
      return new Promise((resolve) => proc.on('close', resolve));
    },
  },
];

const main = async () => {
  console.clear();
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│         🔧 Web Pages Starter CLI            │');
  console.log('└─────────────────────────────────────────────┘\n');

  const { action } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'action',
      message: 'What do you want to do?',
      choices: tools.map((t) => `${t.name} - ${t.description}`),
    },
  ]);

  const tool = tools.find((t) => `${t.name} - ${t.description}` === action);
  if (!tool) return;

  console.log(`\n${tool.name}\n`);
  await tool.action();
};

main();