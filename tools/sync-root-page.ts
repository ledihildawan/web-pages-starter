import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '../src/configs/i18n';
import { PATHS } from '../src/configs/paths';
import { log, logBox } from './shared/logger';
import { wrapMainError } from './shared/signal-handler';

const SITE_TS_PATH = path.join(PATHS.ROOT, PATHS.SRC, 'configs', 'site.ts');
const GLOBAL_JSON5_PATH = path.join(
  PATHS.ROOT,
  PATHS.SRC,
  'data',
  'global.json5',
);
const PAGES_DIR = path.join(PATHS.ROOT, PATHS.SRC, 'pages');
const LOCALES_DIR = path.join(PATHS.ROOT, PATHS.SRC, 'locales');

function getCurrentRootPage(): string {
  const content = fs.readFileSync(SITE_TS_PATH, 'utf-8');
  const match = content.match(
    /export\s+const\s+ROOT_PAGE\s*=\s*['"]([^'"]+)['"]/,
  );
  return match ? match[1] : 'home';
}

function getCurrentRootFolder(): string {
  const currentRootPage = getCurrentRootPage();
  const entries = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (folders.includes(currentRootPage)) {
    return currentRootPage;
  }

  for (const folder of folders) {
    const localePath = path.join(
      LOCALES_DIR,
      i18nConfig.defaultLocale,
      `${folder}.json`,
    );
    if (fs.existsSync(localePath)) {
      const content = fs.readFileSync(localePath, 'utf-8');
      const pageIdMatch = content.match(/"page_id":\s*"([^"]+)"/);
      if (pageIdMatch && pageIdMatch[1] === currentRootPage) {
        return folder;
      }
    }
  }

  return folders.includes('home')
    ? 'home'
    : folders.find((f) => f !== 'not-found') || folders[0] || '';
}

async function main() {
  const currentRootPage = getCurrentRootPage();
  const currentFolder = getCurrentRootFolder();

  logBox('Sync Root Page', {
    'ROOT_PAGE in config': `${currentRootPage} (index)`,
    'Current folder': currentFolder,
  });

  if (currentFolder === currentRootPage) {
    log.info('Already synced — ROOT_PAGE matches current folder');
    return;
  }

  const newName = currentRootPage;
  const targetFolder = path.join(PAGES_DIR, newName);

  if (fs.existsSync(targetFolder)) {
    log.warn('Warning: Target folder already exists — skipping rename');
    return;
  }

  const oldFolder = path.join(PAGES_DIR, currentFolder);
  log.info(`Renaming folder: ${currentFolder} -> ${newName}`);
  fs.renameSync(oldFolder, targetFolder);

  const localeDirs = fs.readdirSync(LOCALES_DIR).filter((f) => {
    const stat = fs.statSync(path.join(LOCALES_DIR, f));
    return stat.isDirectory();
  });

  log.info('Renaming locale files...');
  for (const locale of localeDirs) {
    const oldLocalePath = path.join(
      LOCALES_DIR,
      locale,
      `${currentFolder}.json`,
    );
    const newLocalePath = path.join(LOCALES_DIR, locale, `${newName}.json`);
    if (fs.existsSync(oldLocalePath)) {
      fs.renameSync(oldLocalePath, newLocalePath);
    }
  }

  log.info('Updating include paths in .njk files...');
  const njkFiles = getAllNjkFiles(PAGES_DIR);
  for (const file of njkFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const oldIncludePattern = new RegExp(`"${currentFolder}/`, 'g');
    if (oldIncludePattern.test(content)) {
      content = content.replace(oldIncludePattern, `"${newName}/`);
      fs.writeFileSync(file, content);
    }
  }

  log.info('Updating global.json5...');
  let globalContent = fs.readFileSync(GLOBAL_JSON5_PATH, 'utf-8');
  globalContent = globalContent.replace(
    /"root_page":\s*"[^"]*"/,
    `"root_page": "${newName}"`,
  );
  fs.writeFileSync(GLOBAL_JSON5_PATH, globalContent);

  logBox('Sync Complete', {
    Folder: currentFolder,
    Locale: `${newName}.json (all locales)`,
    'global.json5': 'Updated root_page',
  });
}

function getAllNjkFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllNjkFiles(fullPath));
    } else if (entry.name.endsWith('.njk')) {
      files.push(fullPath);
    }
  }
  return files;
}

wrapMainError(main);
