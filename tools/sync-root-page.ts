#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { i18nConfig } from '../src/configs/i18n';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE_TS_PATH = path.join(ROOT, 'src', 'configs', 'site.ts');
const GLOBAL_JSON5_PATH = path.join(ROOT, 'src', 'data', 'global.json5');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');

function getCurrentRootPage(): string {
  const content = fs.readFileSync(SITE_TS_PATH, 'utf-8');
  const match = content.match(/export\s+const\s+ROOT_PAGE\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : 'home';
}

function getCurrentRootFolder(): string {
  const currentRootPage = getCurrentRootPage();
  const entries = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (folders.includes(currentRootPage)) {
    return currentRootPage;
  }

  for (const folder of folders) {
    const localePath = path.join(LOCALES_DIR, i18nConfig.defaultLocale, `${folder}.json5`);
    if (fs.existsSync(localePath)) {
      const content = fs.readFileSync(localePath, 'utf-8');
      const pageIdMatch = content.match(/"page_id":\s*"([^"]+)"/);
      if (pageIdMatch && pageIdMatch[1] === currentRootPage) {
        return folder;
      }
    }
  }

  return folders.includes('home') ? 'home' : (folders.find(f => f !== '404') || folders[0] || '');
}

async function main() {
  const currentRootPage = getCurrentRootPage();
  const currentFolder = getCurrentRootFolder();

  console.log('┌────────────────────────────────────────┐');
  console.log('│         🔄 Sync Root Page              │');
  console.log('├────────────────────────────────────────┤');
  console.log(`│  ROOT_PAGE in config: ${currentRootPage.padEnd(18)}│`);
  console.log(`│  Current folder:      ${currentFolder.padEnd(18)}│`);
  console.log('└────────────────────────────────────────┘\n');

  if (currentFolder === currentRootPage) {
    console.log('✅ Already synced - ROOT_PAGE matches current folder');
    return;
  }

  const newName = currentRootPage;
  const targetFolder = path.join(PAGES_DIR, newName);

  if (fs.existsSync(targetFolder)) {
    console.log('⚠️  Target folder already exists');
    console.log('   Skipping folder rename');
    return;
  }

  const oldFolder = path.join(PAGES_DIR, currentFolder);
  console.log(`📁 Renaming folder: ${currentFolder} → ${newName}`);
  fs.renameSync(oldFolder, targetFolder);

  const localeDirs = fs.readdirSync(LOCALES_DIR).filter(f => {
    const stat = fs.statSync(path.join(LOCALES_DIR, f));
    return stat.isDirectory();
  });

  console.log('📄 Renaming locale files...');
  for (const locale of localeDirs) {
    const oldLocalePath = path.join(LOCALES_DIR, locale, `${currentFolder}.json5`);
    const newLocalePath = path.join(LOCALES_DIR, locale, `${newName}.json5`);
    if (fs.existsSync(oldLocalePath)) {
      fs.renameSync(oldLocalePath, newLocalePath);
    }
  }

  console.log('🔗 Updating include paths in .njk files...');
  const njkFiles = getAllNjkFiles(PAGES_DIR);
  for (const file of njkFiles) {
    let content = fs.readFileSync(file, 'utf-8');
    const oldIncludePattern = new RegExp(`"${currentFolder}/`, 'g');
    if (oldIncludePattern.test(content)) {
      content = content.replace(oldIncludePattern, `"${newName}/`);
      fs.writeFileSync(file, content);
    }
  }

  console.log('📝 Updating global.json5...');
  let globalContent = fs.readFileSync(GLOBAL_JSON5_PATH, 'utf-8');
  globalContent = globalContent.replace(/"root_page":\s*"[^"]*"/, `"root_page": "${newName}"`);
  fs.writeFileSync(GLOBAL_JSON5_PATH, globalContent);

  console.log('\n┌────────────────────────────────────────┐');
  console.log('│         ✅ Sync Complete               │');
  console.log('├────────────────────────────────────────┤');
  console.log(`│  Folder:    ${currentFolder.padEnd(24)}│`);
  console.log(`│  Locale:    ${newName}.json5 (all locales)     │`);
  console.log(`│  global.json5: Updated root_page       │`);
  console.log('└────────────────────────────────────────┘\n');
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

main();
