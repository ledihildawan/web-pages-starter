import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { join, relative } from 'pathe';
import { i18nConfig } from '@config/i18n';
import { lookup } from '@generated/paths';
import { isSystemPageId, isSystemPageSlug, scanPages } from '@web-pages-starter/page-system';
import { readJSON5 } from '@web-pages-starter/core/json5';
import { log } from '@web-pages-starter/core/logger';
import { setupSigintHandler, wrapMainError } from '@web-pages-starter/core/signal-handler';
import inquirer from 'inquirer';

const args = process.argv.slice(2);

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp(): void {
  log.info(`
Delete Page

Delete a page and all its locale files.

Usage:
  bun ./packages/page-system/cli/delete-page.ts [options]
  bun ./packages/page-system/cli/delete-page.ts <page-name> [options]

Arguments:
  <page-name>    Optional. Name, url_path, or page_id of the page to delete.
                 If omitted, shows an interactive page selector.

Options:
  --name <name>  Delete the specified page by name, url_path, or page_id.
  --dry-run      Preview what would be deleted without actually deleting.
  --help         Show this help message.
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const nameIndex = args.indexOf('--name');
const dryRun = args.includes('--dry-run');
const providedPageName = nameIndex !== -1 ? args[nameIndex + 1] : args.find((a) => !a.startsWith('--'));
const providedPageNameTrimmed = providedPageName?.trim();

interface PageInfo {
  name: string;
  dir: string;
  pageId: string;
  urlPath: string;
}

function getAllPages(): PageInfo[] {
  const pagesDir = lookup('@pages');
  const scanned = scanPages(pagesDir, '');
  return scanned.map((p) => {
    let pageId = p.name;
    let urlPath = p.name;
    try {
      const data = readJSON5(join(p.dir, 'data.json5'));
      pageId = String(data.page_id || p.name.split('/').pop() || p.name);
      urlPath = String(data.url_path || p.name);
    } catch {}
    return { name: p.name, dir: p.dir, pageId, urlPath };
  });
}

function isSystemPage(name: string): boolean {
  return isSystemPageId(name) || isSystemPageSlug(name, i18nConfig.defaultLocale);
}

async function selectPage(): Promise<PageInfo | null> {
  const pages = getAllPages();
  if (pages.length === 0) {
    log.error('Error: No pages found in pages/.');
    log.info('Tip: Run `bun run cli` → Generate Page to create one.\n');
    return null;
  }
  log.info('Ctrl+C to cancel at any time.\n');

  const choices = pages.map((p) => {
    const isSystem = isSystemPage(p.pageId) || isSystemPage(p.urlPath);
    return {
      name: isSystem ? `${p.name} (system)` : p.name,
      value: p,
      disabled: isSystem ? true : undefined,
    };
  });

  const { page } = await inquirer.prompt<{ page: PageInfo }>([
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
    const full = join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectFiles(full, ext, out);
    } else if (entry.endsWith(ext)) {
      out.push(full);
    }
  }
}

function findReferences(pageInfo: PageInfo): Reference[] {
  const refs: Reference[] = [];
  const searchPatterns = [pageInfo.urlPath, pageInfo.name, pageInfo.pageId];
  const pattern = new RegExp(
    `/${searchPatterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}(?=[^a-zA-Z0-9-]|$)`,
    'g',
  );

  const scanFiles: string[] = [];
  collectFiles(join('pages'), '.njk', scanFiles);
  collectFiles(join('shared'), '.njk', scanFiles);
  collectFiles(join('layouts'), '.njk', scanFiles);

  const menuFile = join('data', 'menu.json5');
  if (fs.existsSync(menuFile)) scanFiles.push(menuFile);

  for (const file of scanFiles) {
    if (file.includes(pageInfo.dir)) continue;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        refs.push({
          file: relative(process.cwd(), file).replace(/\\/g, '/'),
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
  log.info(`   - pages/${pageName}/ (entire folder)`);
  log.info(`   - locales/*/${pageName}.json (all locale directories)\n`);

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

function deletePage(pageInfo: PageInfo): {
  folderDeleted: boolean;
  localeFilesDeleted: number;
} {
  let folderDeleted = false;
  if (fs.existsSync(pageInfo.dir)) {
    fs.rmSync(pageInfo.dir, { recursive: true, force: true });
    folderDeleted = true;
  }

  let localeFilesDeleted = 0;
  const localesDir = lookup('@locales');
  if (fs.existsSync(localesDir)) {
    for (const localeCode of fs.readdirSync(localesDir)) {
      const localeFile = join(localesDir, localeCode, `${pageInfo.pageId}.json`);
      if (fs.existsSync(localeFile)) {
        fs.rmSync(localeFile, { force: true });
        localeFilesDeleted++;
      }
    }
  }

  return { folderDeleted, localeFilesDeleted };
}

async function runSyncLocales(): Promise<void> {
  return new Promise((resolve, reject) => {
    log.info('\nRunning locale sync to ensure consistency...');
    const proc = spawn('bun', ['./packages/i18n/cli/sync-locales.ts'], {
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
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
  let pageInfo: PageInfo | null | undefined = null;

  if (providedPageNameTrimmed) {
    const pages = getAllPages();
    pageInfo =
      pages.find(
        (p) =>
          p.name === providedPageNameTrimmed ||
          p.urlPath === providedPageNameTrimmed ||
          p.pageId === providedPageNameTrimmed,
      ) || null;
    if (!pageInfo) {
      throw new Error(
        `Page "${providedPageNameTrimmed}" not found.\n  Tip: Run \`bun run cli\` → Delete Page for an interactive selector.`,
      );
    }
  } else {
    pageInfo = await selectPage();
  }

  if (!pageInfo) return;

  if (isSystemPage(pageInfo.pageId) || isSystemPage(pageInfo.urlPath)) {
    throw new Error(`"${pageInfo.name}" is a system page and cannot be deleted.`);
  }

  const refs = findReferences(pageInfo);
  showReferenceWarnings(refs);

  if (dryRun) {
    log.info(`\n[DRY RUN] Would delete page: "${pageInfo.name}"`);
    log.info(`\n  Would delete:`);
    log.info(`    pages/${pageInfo.name}/ (entire folder)`);

    const localesDir = lookup('@locales');
    const localeFiles: string[] = [];
    if (fs.existsSync(localesDir)) {
      for (const localeCode of fs.readdirSync(localesDir)) {
        const localeFile = join(localesDir, localeCode, `${pageInfo.pageId}.json`);
        if (fs.existsSync(localeFile)) {
          localeFiles.push(`locales/${localeCode}/${pageInfo.pageId}.json`);
        }
      }
    }
    if (localeFiles.length > 0) {
      for (const f of localeFiles) log.info(`    ${f}`);
    } else {
      log.info(`    (no locale files found)`);
    }
    log.info('\n  Run without --dry-run to actually delete.\n');
    return;
  }

  const confirmed = await confirmDeletion(pageInfo.name);
  if (!confirmed) return;

  const { folderDeleted, localeFilesDeleted } = deletePage(pageInfo);

  log.success(`\nDone: Page "${pageInfo.name}" deleted`);
  log.info(`  - Folder: ${folderDeleted ? 'deleted' : 'not found'}`);
  log.info(`  - Locale files: ${localeFilesDeleted} files removed (page_id: ${pageInfo.pageId})`);
  log.info('\nNext: Run `bun run dev` to verify the page is gone.\n');

  try {
    await runSyncLocales();
  } catch {
    log.warn('Continuing despite sync-locales issues...');
  }
}

setupSigintHandler();
wrapMainError(main);
