import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import { i18nConfig } from '../src/configs/i18n';
import { isSystemPageId, isSystemPageSlug } from '../src/configs/pages';
import { PATHS } from '../src/configs/paths';
import { LOCALE_CODES } from '../src/packages/i18n/data/locales';
import { log } from './shared/logger';

const args = process.argv.slice(2);
const providedPageName = args[0]?.trim();

const defaultLocale = i18nConfig.defaultLocale;

function getAllPages(): string[] {
  const pagesDir = path.resolve(PATHS.ROOT, PATHS.SRC, 'pages');
  if (!fs.existsSync(pagesDir)) return [];
  return fs
    .readdirSync(pagesDir)
    .filter((f) => fs.statSync(path.join(pagesDir, f)).isDirectory());
}

function isSystemPage(name: string): boolean {
  return isSystemPageId(name) || isSystemPageSlug(name, defaultLocale);
}

async function selectPage(): Promise<string | null> {
  const pages = getAllPages();
  if (pages.length === 0) {
    log.error('Error: No pages found in src/pages/.');
    return null;
  }

  const choices = pages.map((name) => {
    const isSystem = isSystemPage(name);
    return {
      name: isSystem ? `${name} (system)` : name,
      value: name,
      disabled: isSystem ? true : undefined,
    };
  });

  const { page } = await inquirer.prompt<{ page: string }>([
    {
      type: 'rawlist',
      name: 'page',
      message: 'Select a page to delete:',
      choices,
    },
  ]);

  return page;
}

interface Reference {
  file: string;
  line: number;
  content: string;
}

function collectFiles(dir: string, ext: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, ext, out);
    } else if (entry.endsWith(ext)) {
      out.push(full);
    }
  }
}

function findReferences(pageName: string): Reference[] {
  const refs: Reference[] = [];
  const pattern = new RegExp(`/${pageName}(?=[^a-zA-Z0-9-]|$)`, 'g');

  const scanFiles: string[] = [];
  collectFiles(path.join(PATHS.SRC, 'pages'), '.njk', scanFiles);
  collectFiles(path.join(PATHS.SRC, 'components'), '.njk', scanFiles);
  collectFiles(path.join(PATHS.SRC, 'layouts'), '.njk', scanFiles);

  const menuFile = path.join(PATHS.SRC, 'data', 'menu.json5');
  if (fs.existsSync(menuFile)) scanFiles.push(menuFile);

  const pageDir = path.join(PATHS.SRC, 'pages', pageName);

  for (const file of scanFiles) {
    if (file.startsWith(pageDir)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        refs.push({
          file: path.relative(PATHS.ROOT, file).replace(/\\/g, '/'),
          line: i + 1,
          content: lines[i].trim(),
        });
      }
    }
  }

  return refs;
}

function showReferenceWarnings(refs: Reference[]): void {
  if (refs.length === 0) return;

  log.warn(`\nWarning: Found ${refs.length} reference(s) to this page:`);
  for (const ref of refs) {
    log.warn(`  ${ref.file}:${ref.line}`);
  }
  log.warn('These links will break after deletion. Fix them manually after.\n');
}

async function confirmDeletion(pageName: string): Promise<boolean> {
  log.info(`\nYou are about to delete page: "${pageName}"`);
  log.info('This will DELETE:');
  log.info(`   - src/pages/${pageName}/ (entire folder)`);
  log.info(`   - src/locales/*/${pageName}.json (all 87 locales)\n`);

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Type "yes" to confirm deletion:',
      default: false,
    },
  ]);

  if (!confirm) {
    log.cancelled();
    return false;
  }

  const { doubleConfirm } = await inquirer.prompt<{
    doubleConfirm: string;
  }>([
    {
      type: 'input',
      name: 'doubleConfirm',
      message: 'Re-type the page name to confirm:',
      default: '',
    },
  ]);

  if (doubleConfirm.toLowerCase() !== pageName.toLowerCase()) {
    log.info('Cancelled.');
    return false;
  }

  return true;
}

function deletePage(pageName: string): {
  folderDeleted: boolean;
  localeFilesDeleted: number;
} {
  const pagesDir = path.resolve(PATHS.ROOT, PATHS.SRC, 'pages');
  const pageDir = path.join(pagesDir, pageName);

  let folderDeleted = false;
  if (fs.existsSync(pageDir)) {
    fs.rmSync(pageDir, { recursive: true, force: true });
    folderDeleted = true;
  }

  let localeFilesDeleted = 0;
  const localesDir = path.resolve(PATHS.ROOT, PATHS.LOCALES);
  for (const lng of LOCALE_CODES) {
    const localeFile = path.join(localesDir, lng, `${pageName}.json`);
    if (fs.existsSync(localeFile)) {
      fs.rmSync(localeFile, { force: true });
      localeFilesDeleted++;
    }
  }

  return { folderDeleted, localeFilesDeleted };
}

async function runSyncLocales(): Promise<void> {
  return new Promise((resolve, reject) => {
    log.info('\nRunning locale sync to ensure consistency...');
    const proc = spawn('bun', ['./tools/sync-locales.ts'], {
      stdio: 'inherit',
      shell: false,
      cwd: PATHS.ROOT,
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        log.warn('Warning: Locale sync reported issues.');
        reject(new Error('sync-locales failed'));
      } else {
        resolve();
      }
    });
    proc.on('error', reject);
  });
}

async function main(): Promise<void> {
  let pageName: string | null | undefined = providedPageName;

  if (!pageName) {
    pageName = await selectPage();
  }

  if (!pageName) return;

  if (isSystemPage(pageName)) {
    log.error(`Error: "${pageName}" is a system page and cannot be deleted.`);
    process.exit(1);
  }

  const refs = findReferences(pageName);
  showReferenceWarnings(refs);

  const confirmed = await confirmDeletion(pageName);
  if (!confirmed) return;

  const { folderDeleted, localeFilesDeleted } = deletePage(pageName);

  log.success(`\nDone: Page "${pageName}" deleted`);
  log.info(`  - Folder: ${folderDeleted ? 'deleted' : 'not found'}`);
  log.info(`  - Locale files: ${localeFilesDeleted} files removed`);

  try {
    await runSyncLocales();
  } catch {
    log.warn('Continuing despite sync-locales issues...');
  }
}

import { setupSigintHandler, wrapMainError } from './shared/signal-handler';

setupSigintHandler();
wrapMainError(main);
