import fs from 'node:fs';
import { join } from 'pathe';
import { i18nConfig } from '@config/i18n';
import { lookup } from '@generated/paths';
import { getActiveLocaleCodes } from '@web-pages-starter/i18n/engine/active-locales';
import { isSystemPageSlug, SYSTEM_PAGE_IDS, type SystemPageId } from '@web-pages-starter/page-system';
import { log } from '@web-pages-starter/core/logger';
import slug from 'limax';

const args = process.argv.slice(2);

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp(): void {
  log.info(`
Generate a new page with locale files for all active locales.

Usage:
  bun ./packages/page-system/cli/generate-page.ts <page-path> [options]

Arguments:
  <page-path>    Required. URL path for the new page.
                 Use "/" for nested pages (e.g. "services/web")

Options:
  --help         Show this help message

Examples:
  bun ./packages/page-system/cli/generate-page.ts pricing
  bun ./packages/page-system/cli/generate-page.ts services/web
  bun ./packages/page-system/cli/generate-page.ts "(marketing)/landing"
  bun ./packages/page-system/cli/generate-page.ts blog/getting-started
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const inputPath = args.find((a) => !a.startsWith('--'));

if (!inputPath) {
  log.error('Error: Please provide a page path.');
  log.info('Tip: Run with --help to see usage examples.\n');
  process.exit(1);
}

const groupMatch = inputPath.match(/^\(([^)]+)\)\/(.+)/);
const groupFolder = groupMatch ? `(${groupMatch[1]})` : null;
const pathWithoutGroup = groupMatch ? groupMatch[2] : inputPath;

const segments = pathWithoutGroup.split('/').filter(Boolean);
if (segments.length === 0) {
  log.error('Error: Invalid page path.');
  process.exit(1);
}

const formattedSegments = segments.map((s) => slug(s, { tone: true, maintainCase: false, custom: {} })).filter(Boolean);

if (formattedSegments.length !== segments.length) {
  log.error('Error: Page path contains invalid characters.');
  process.exit(1);
}

const lastSegment = formattedSegments.at(-1) ?? '';
const fullSlug = formattedSegments.join('-');

if (
  isSystemPageSlug(fullSlug, i18nConfig.defaultLocale) ||
  isSystemPageSlug(lastSegment, i18nConfig.defaultLocale) ||
  SYSTEM_PAGE_IDS.includes(fullSlug as SystemPageId) ||
  SYSTEM_PAGE_IDS.includes(lastSegment as SystemPageId)
) {
  log.error(`Error: "${inputPath}" contains a reserved system page name.`);
  process.exit(1);
}

const pageId = lastSegment;
const urlPath = formattedSegments.join('/');
const titleCase = lastSegment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const pagesRoot = lookup('@pages');
const targetDir = groupFolder
  ? join(pagesRoot, groupFolder, ...formattedSegments)
  : join(pagesRoot, ...formattedSegments);

if (fs.existsSync(targetDir)) {
  log.error(`Error: Page "${urlPath}" already exists.`);
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
          {{ i18n.t('${pageId}:hero.badge') }}
        </span>
      </div>
      <h1 class="text-6xl md:text-7xl font-black tracking-tighter mbe-8 leading-[1.1] bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
        {{ i18n.t('${pageId}:hero.title') }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-300 max-inline-2xl mx-auto mbe-14 leading-relaxed font-medium">
        {{ i18n.t('${pageId}:hero.description') }}
      </p>
    </div>
  </section>

  <section class="pbs-32 pbe-32 px-6 content-auto">
    <div class="max-inline-6xl mx-auto">
      <p class="text-slate-300 text-lg leading-relaxed text-center">
        {{ i18n.t('${pageId}:content.intro') }}
      </p>
    </div>
  </section>

  {% include "shared/ui/composites/cta.njk" %}
{% endblock %}
`;

const jsonContent = `{
  "page_id": "${pageId}",
  "url_path": "${urlPath}",
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
    "description": "This text is managed from locales/{{lng}}/${pageId}.json"
  },
  "content": {
    "intro": "Add your content here."
  }
}
`;

try {
  fs.writeFileSync(join(targetDir, 'index.njk'), njkContent);
  fs.writeFileSync(join(targetDir, 'data.json5'), jsonContent);
  fs.writeFileSync(join(targetDir, 'script.ts'), '');
  fs.writeFileSync(join(targetDir, 'style.css'), '');

  const baseLocaleDir = lookup('@locales');
  if (fs.existsSync(baseLocaleDir)) {
    for (const localeCode of getActiveLocaleCodes()) {
      const filePath = join(baseLocaleDir, localeCode, `${pageId}.json`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, localeContent, 'utf-8');
        log.info(`Created locale [${localeCode}]: locales/${localeCode}/${pageId}.json`);
      }
    }
  }

  log.success(`\nDone: Page "${urlPath}" generated`);
  log.info(`Path: pages/${groupFolder ? `${groupFolder}/` : ''}${urlPath}/`);
  log.info(`page_id: ${pageId}`);
  log.info(`url_path: ${urlPath}`);
  if (formattedSegments.length > 1) {
    log.info(`\nBreadcrumb (auto-generated):`);
    log.info(
      `  Home → ${formattedSegments
        .slice(0, -1)
        .map((s) => s.replace(/-/g, ' '))
        .join(' → ')} → ${titleCase}`,
    );
  }
  log.info('\nNext: Restart dev server — `bun run dev` — to see the new entry detected.');
  log.info('Tip: Run `bun run cli` → Generate Page to create pages interactively.\n');
} catch (error) {
  log.error(`Error: Generation failed — ${error}`);
  process.exit(1);
}
