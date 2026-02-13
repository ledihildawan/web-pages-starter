import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const pageName = args[0];

if (!pageName) {
  console.error('❌ Error: Please provide a page name.');
  process.exit(1);
}

const formattedName = pageName.toLowerCase().replace(/\s+/g, '-');
const titleCase = pageName
  .replace(/-/g, ' ')
  .replace(/\b\w/g, (l) => l.toUpperCase());

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, 'src/pages', formattedName);
const baseLocaleDir = path.resolve(ROOT, 'src/locales');

if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: Page "${formattedName}" already exists!`);
  process.exit(1);
}

// 1. Buat folder halaman di src/pages
fs.mkdirSync(targetDir, { recursive: true });

// 2. Konten Nunjucks (Scoped page.*)
const njkContent = `{% extends "public/main.njk" %}

{% block content %}
<section class="py-24 relative overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="max-w-3xl">
      <h1 class="text-5xl md:text-6xl font-bold tracking-tight mb-6">
        {{ i18n.t('page.hero.title').v | safe }}
      </h1>
      <p class="text-xl text-slate-400 leading-relaxed mb-10">
        {{ i18n.t('page.hero.description').v }}
      </p>
    </div>
  </div>
</section>
{% endblock %}
`;

// 3. Konten JSON Struktur (Data non-translatable)
const jsonContent = `{
  "meta": {
    "title": "${titleCase}",
    "description": "Structure data for ${titleCase}"
  }
}
`;

// 4. Konten JSON Lokalisasi (Template Multi-Bahasa)
const localeContent = `{
  "hero": {
    "title": "${titleCase} Page",
    "description": "This text is managed from locales/{{lng}}/${formattedName}.json"
  }
}
`;

// 5. Konten TS & CSS (CSS otomatis di-load via Rsbuild Entry)
const tsContent = `console.log('${titleCase} page initialized');`;
const cssContent = `/* Styles for ${formattedName} */\n\n.${formattedName}-section {\n  @apply relative;\n}`;

try {
  // Tulis file ke src/pages
  fs.writeFileSync(path.join(targetDir, 'index.njk'), njkContent);
  fs.writeFileSync(path.join(targetDir, 'index.ts'), tsContent);
  fs.writeFileSync(path.join(targetDir, 'index.css'), cssContent);
  fs.writeFileSync(path.join(targetDir, 'index.json'), jsonContent);

  // 6. Sinkronisasi Otomatis ke semua folder bahasa di src/locales
  if (fs.existsSync(baseLocaleDir)) {
    const languages = fs.readdirSync(baseLocaleDir).filter(f =>
      fs.statSync(path.join(baseLocaleDir, f)).isDirectory()
    );

    languages.forEach(lng => {
      const lngDir = path.join(baseLocaleDir, lng);
      const filePath = path.join(lngDir, `${formattedName}.json`);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, localeContent.replace('{{lng}}', lng));
        console.log(`🌐 Created locale [${lng}]: locales/${lng}/${formattedName}.json`);
      }
    });
  }

  console.log(`\n✅ Page "${formattedName}" generated successfully!`);
  console.log(`📂 Path: src/pages/${formattedName}/`);
  console.log(`\n💡 Tip: Restart dev server if the new entry is not detected.`);
} catch (error) {
  console.error('❌ Generation failed:', error);
}