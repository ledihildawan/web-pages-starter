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
const targetDir = path.resolve(process.cwd(), 'src/pages', formattedName);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: Page "${formattedName}" already exists!`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const njkContent = `{% extends "public/main.njk" %}

{% block title %}{{ meta.title }}{% endblock %}

{% block content %}
<main class="py-20">
  <div class="container mx-auto px-6">
    <h1 class="text-4xl font-bold">{{ hero.title }}</h1>
    <p class="mt-4 text-slate-600">{{ hero.description }}</p>
  </div>
</main>
{% endblock %}
`;

const tsContent = `console.log('Logic for ${titleCase} initialized');`;

const cssContent = `/* Styles for ${formattedName} */`;

const jsonContent = `{
  "meta": {
    "title": "${titleCase}",
    "description": "Page description for ${titleCase}"
  },
  "hero": {
    "title": "${titleCase}",
    "description": "Managed via src/pages/${formattedName}/index.json"
  }
}
`;

try {
  fs.writeFileSync(path.join(targetDir, 'index.njk'), njkContent);
  fs.writeFileSync(path.join(targetDir, 'index.ts'), tsContent);
  fs.writeFileSync(path.join(targetDir, 'index.css'), cssContent);
  fs.writeFileSync(path.join(targetDir, 'index.json'), jsonContent);

  console.log(`\n✅ Page Generated: ${formattedName}`);
  console.log(`📂 Location: src/pages/${formattedName}/`);
} catch (error) {
  console.error('❌ Generation failed:', error);
}
