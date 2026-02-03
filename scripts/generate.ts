import fs from 'node:fs';
import path from 'node:path';

// 1. Ambil nama halaman dari argumen
const args = process.argv.slice(2);
const pageName = args[0];

if (!pageName) {
  console.error('❌ Error: Mohon sebutkan nama halaman.');
  console.log('👉 Contoh: bun run gen contact-us');
  process.exit(1);
}

// 2. Format nama (lowercase & kebab-case)
const formattedName = pageName.toLowerCase().replace(/\s+/g, '-');
// Format Judul (Contact Us)
const titleCase = pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// 3. Tentukan path tujuan
const targetDir = path.resolve(process.cwd(), 'src/pages', formattedName);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: Halaman "${formattedName}" sudah ada!`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// --- TEMPLATE CONTENT ---

// A. Nunjucks (.njk)
const njkContent = `{% extends "base.njk" %}

{# Title diambil dari page JSON #}
{% block title %}{{ meta.title }}{% endblock %}

{% block content %}
<section class="pt-32 px-6 min-h-screen">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">{{ hero.title }}</h1>
    <p class="text-slate-400">{{ hero.description }}</p>
  </div>
</section>
{% endblock %}
`;

// B. TypeScript (.ts)
const tsContent = `import './${formattedName}.css';

console.log('Script loaded for ${formattedName}');
`;

// C. CSS (.css)
const cssContent = `/* Style khusus halaman ${formattedName} */`;

// D. JSON Content (.json) -> NAMA FILE SPESIFIK
const jsonContent = `{
  "meta": {
    "title": "${titleCase} | Starter App",
    "description": "Halaman ${titleCase}"
  },
  "hero": {
    "title": "Welcome to ${titleCase}",
    "description": "This content is managed in ${formattedName}.json"
  }
}
`;

// --- WRITE FILES ---

try {
  fs.writeFileSync(path.join(targetDir, `${formattedName}.njk`), njkContent);
  fs.writeFileSync(path.join(targetDir, `${formattedName}.ts`), tsContent);
  fs.writeFileSync(path.join(targetDir, `${formattedName}.css`), cssContent);
  fs.writeFileSync(path.join(targetDir, `${formattedName}.json`), jsonContent); // <--- INI PENTING

  console.log(`\n✅ Berhasil membuat halaman: ${formattedName}`);
  console.log(`📂 Lokasi: src/pages/${formattedName}/`);
  console.log(`   ├── 📄 ${formattedName}.njk`);
  console.log(`   ├── ⚙️  ${formattedName}.json`);
  console.log(`   ├── 📘 ${formattedName}.ts`);
  console.log(`   └── 🎨 ${formattedName}.css`);

} catch (error) {
  console.error('❌ Gagal membuat file:', error);
}