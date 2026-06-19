import fs from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { getSystemPageSlug, SYSTEM_PAGE_IDS } from '@page-system/system-pages';
import { log, logBox } from '@scripts/lib/logger';
import { wrapMainError } from '@scripts/lib/signal-handler';
import { lookup } from '@utils/paths';

const PAGES_DIR = lookup('@', 'pages');

function getPageIdFromFolder(folderName: string): string | null {
  const indexPath = path.join(PAGES_DIR, folderName, 'data.json5');
  if (!fs.existsSync(indexPath)) return null;
  const content = fs.readFileSync(indexPath, 'utf-8');
  const match = content.match(/"page_id":\s*"([^"]+)"/);
  return match ? match[1] : null;
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

async function main() {
  const defaultLocale = i18nConfig.defaultLocale;
  const renames: { pageId: string; from: string; to: string }[] = [];

  for (const pageId of SYSTEM_PAGE_IDS) {
    const expectedSlug = getSystemPageSlug(pageId, defaultLocale);
    const expectedPath = path.join(PAGES_DIR, expectedSlug);

    if (fs.existsSync(expectedPath)) {
      continue;
    }

    const entries = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    const currentFolder = folders.find((f) => getPageIdFromFolder(f) === pageId);

    if (!currentFolder || currentFolder === expectedSlug) {
      continue;
    }

    log.info(`Renaming folder: ${currentFolder} -> ${expectedSlug}`);
    fs.renameSync(path.join(PAGES_DIR, currentFolder), expectedPath);
    renames.push({ pageId, from: currentFolder, to: expectedSlug });
  }

  if (renames.length > 0) {
    log.info('Updating include paths in .njk files...');
    const njkFiles = getAllNjkFiles(PAGES_DIR);
    for (const file of njkFiles) {
      let content = fs.readFileSync(file, 'utf-8');
      let changed = false;
      for (const { from, to } of renames) {
        const updated = content.replaceAll(`"${from}/`, `"${to}/`);
        if (updated !== content) {
          content = updated;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(file, content);
      }
    }
  }

  if (renames.length === 0) {
    logBox('Sync System Pages', {
      Locale: defaultLocale,
      Status: 'Already synced',
    });
    log.success('Already synced');
    return;
  }

  logBox('Sync System Pages', {
    Locale: defaultLocale,
    Renamed: renames.length,
  });
  for (const rename of renames) {
    log.success(`${rename.from} -> ${rename.to} (${rename.pageId})`);
  }
}

wrapMainError(main);
