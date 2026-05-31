import fs from 'node:fs';
import path from 'node:path';
import { SUPPORTED_LANG_CODES } from '../src/configs/locales';
import { PATHS } from '../src/configs/paths';

const args = process.argv.slice(2);
const pageName = args[0];

if (!pageName) {
  console.error('Error: Please provide a page name.');
  console.error('Usage: bun run gen:page <page-name>');
  process.exit(1);
}

const formattedName = pageName.toLowerCase().replace(/\s+/g, '-');
const titleCase = pageName
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (l) => l.toUpperCase());

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, PATHS.SRC, 'pages', formattedName);
const baseLocaleDir = path.resolve(ROOT, PATHS.LOCALES);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Page "${formattedName}" already exists!`);
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
          {{ i18n.t('page.' + page.hero.t_key + '.badge') | default('Badge') }}
        </span>
      </div>
      <h1 class="text-6xl md:text-7xl font-black tracking-tighter mbe-8 leading-[1.1] bg-linear-to-b from-white to-slate-400 bg-clip-text text-transparent">
        {{ i18n.html('page.' + page.hero.t_key + '.title') }}
      </h1>
      <p class="text-xl md:text-2xl text-slate-300 max-inline-2xl mx-auto mbe-14 leading-relaxed font-medium">
        {{ i18n.t('page.' + page.hero.t_key + '.description') }}
      </p>
    </div>
  </section>

  <section class="pbs-32 pbe-32 px-6 content-auto">
    <div class="max-inline-6xl mx-auto">
      <p class="text-slate-300 text-lg leading-relaxed text-center">
        {{ i18n.t('page.content.intro') | default('Add your content here.') }}
      </p>
    </div>
  </section>

  {% include "cta.njk" %}
{% endblock %}
`;

const jsonContent = `{
  "meta": {
    "title": "${titleCase}",
    "description": "Structure data for ${titleCase}"
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
    "description": "This text is managed from locales/{{lng}}/${formattedName}.json5"
  },
  "content": {
    "intro": "Add your content here."
  }
}
`;

const tsContent = `export {};
`;
const cssContent = `/* Styles for ${formattedName} */\n\n.${formattedName}-section {\n  @apply relative;\n}`;

try {
  fs.writeFileSync(path.join(targetDir, 'index.njk'), njkContent);
  fs.writeFileSync(path.join(targetDir, 'index.ts'), tsContent);
  fs.writeFileSync(path.join(targetDir, 'index.css'), cssContent);
  fs.writeFileSync(path.join(targetDir, 'index.json5'), jsonContent);

  if (fs.existsSync(baseLocaleDir)) {
    for (const lng of SUPPORTED_LANG_CODES) {
      const lngDir = path.join(baseLocaleDir, lng);
      const filePath = path.join(lngDir, `${formattedName}.json5`);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, localeContent, 'utf-8');
        console.log(`Created locale [${lng}]: src/locales/${lng}/${formattedName}.json5`);
      }
    }
  }

  console.log(`\n✅ Page "${formattedName}" generated successfully.`);
  console.log(`📁 Path: src/pages/${formattedName}/`);
  console.log('\n💡 Tip: Restart dev server if the new entry is not detected.');
} catch (error) {
  console.error('❌ Generation failed:', error);
  process.exit(1);
}
