import fs from 'node:fs';
import path from 'node:path';
import { LOCALES } from '@constants';
import { getActiveLocaleCodes } from '@i18n/engine/active-locales';
import {
  isSystemPageSlug,
  SYSTEM_PAGE_IDS,
  type SystemPageId,
} from '@page-engine';
import { resolveRoot } from '@utils/paths';
import { i18nConfig } from '../configs/i18n';
import { log } from './lib/logger';
import { romanize } from './lib/romanize';

const args = process.argv.slice(2);
const pageName = args[0];

if (!pageName) {
  log.error('Error: Please provide a page name.');
  log.info('Usage: bun ./scripts/generate-page.ts <page-name>');
  process.exit(1);
}

const formattedName = romanize(pageName);

if (!formattedName) {
  log.error('Error: Page name must contain valid characters.');
  process.exit(1);
}

const defaultLocale = i18nConfig.defaultLocale;
if (
  isSystemPageSlug(formattedName, defaultLocale) ||
  SYSTEM_PAGE_IDS.includes(formattedName as SystemPageId)
) {
  log.error(`Error: "${formattedName}" is a reserved system page name.`);
  process.exit(1);
}

const titleCase = pageName
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (l) => l.toUpperCase());

const targetDir = resolveRoot('pages', formattedName);
const baseLocaleDir = resolveRoot(LOCALES);

if (fs.existsSync(targetDir)) {
  log.error(`Error: Page "${formattedName}" already exists.`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const njkContent = `{% extends "main.njk" %}

{% block content %}
  <section class="relative pbs-44 pbe-24 px-6 overflow-hidden">
    <div class="absolute inset-bs-0 inset-s-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 inline-full block-full bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-violet-600/15 via-transparent to-transparent -z-10 blur-3xl opacity-60"></div>
    <div class="max-inline-4xl mx-auto text-center">
      <div class="inline-flex items-center gap-3 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-100 text-sm mbe-10 transition-colors hover:bg-violet-500/20 cursor-default gpu-boost">
        <span class="relative flex block-2 inline-2">
          <span class="animate-ping absolute inline-flex block-full inline-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full block-2 inline-2 bg-emerald-500"></span>
        </span>
        <span class="font-bold tracking-wide uppercase text-[10px]">
          {{ i18n.t('${formattedName}:hero.badge') }}
        </span>
      </div>
      <h1 class="text-6xl md:text-7xl font-black tracking-tighter mbe-8 leading-[1.1] bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
        {{ i18n.t('${formattedName}:hero.title') }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-300 max-inline-2xl mx-auto mbe-14 leading-relaxed font-medium">
        {{ i18n.t('${formattedName}:hero.description') }}
      </p>
    </div>
  </section>

  <section class="pbs-32 pbe-32 px-6 content-auto">
    <div class="max-inline-6xl mx-auto">
      <p class="text-slate-300 text-lg leading-relaxed text-center">
        {{ i18n.t('${formattedName}:content.intro') }}
      </p>
    </div>
  </section>

  {% include "shared/layout/cta.njk" %}
{% endblock %}
`;

const jsonContent = `{
  "meta": {
    "title": "${titleCase}",
    "description": "Structured data for ${titleCase}"
  },
  "hero": {
    "t_key": "hero"
  }
}
`;

const localeContent = `{
  "hero": {
    "badge": "Badge",
    "title": "${titleCase} Page",
    "description": "This text is managed from locales/{{lng}}/${formattedName}.json"
  },
  "content": {
    "intro": "Add your content here."
  }
}
`;

const tsContent = '';
const cssContent = '';

try {
  fs.writeFileSync(path.join(targetDir, 'index.njk'), njkContent);
  fs.writeFileSync(path.join(targetDir, 'index.ts'), tsContent);
  fs.writeFileSync(path.join(targetDir, 'index.css'), cssContent);
  fs.writeFileSync(path.join(targetDir, 'index.json5'), jsonContent);

  if (fs.existsSync(baseLocaleDir)) {
    for (const lng of getActiveLocaleCodes()) {
      const lngDir = path.join(baseLocaleDir, lng);
      const filePath = path.join(lngDir, `${formattedName}.json`);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, localeContent, 'utf-8');
        log.info(
          `Created locale [${lng}]: locales/${lng}/${formattedName}.json`,
        );
      }
    }
  }

  log.success(`\nDone: Page "${formattedName}" generated`);
  log.info(`Path: pages/${formattedName}/`);
  log.info('\nTip: Restart dev server if the new entry is not detected.');
} catch (error) {
  log.error(`Error: Generation failed — ${error}`);
  process.exit(1);
}
