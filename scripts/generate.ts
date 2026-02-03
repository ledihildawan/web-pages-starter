import fs from 'node:fs';
import path from 'node:path';

// 1. Ambil nama halaman dari argumen
const args = process.argv.slice(2);
const pageName = args[0];

if (!pageName) {
  console.error('❌ Error: Mohon sebutkan nama halaman.');
  console.log('👉 Contoh: bun run gen contact');
  process.exit(1);
}

// 2. Format nama (lowercase & kebab-case)
const formattedName = pageName.toLowerCase().replace(/\s+/g, '-');

// 3. Tentukan path tujuan
const targetDir = path.resolve(process.cwd(), 'src/pages', formattedName);

// 4. Cek apakah folder sudah ada
if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: Halaman "${formattedName}" sudah ada!`);
  process.exit(1);
}

// 5. Buat folder
fs.mkdirSync(targetDir, { recursive: true });

// --- TEMPLATE CONTENT ---

// A. Template Nunjucks (.njk) -> Extends base.njk
const njkContent = `{% extends "base.njk" %}

{% block title %}${pageName.charAt(0).toUpperCase() + pageName.slice(1)} | Starter{% endblock %}

{% block content %}
<section class="pt-32 px-6 min-h-screen">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">Halaman ${pageName}</h1>
    <p class="text-slate-400">Halaman ini dibuat otomatis.</p>
  </div>
</section>
{% endblock %}

{# Block script khusus halaman ini (jika perlu) #}
{% block scripts %}
<script>
  console.log('Page specific inline script for ${formattedName}');
</script>
{% endblock %}
`;

// B. Template TypeScript (.ts)
// REVISI: Tidak ada lagi import global style.
const tsContent = `// Import CSS Khusus Halaman ini (Jika ada style spesifik saja)
import './${formattedName}.css';

console.log('Logic khusus untuk halaman ${formattedName}');
`;

// C. Template CSS (.css)
const cssContent = `/* Style khusus untuk halaman ${formattedName}.
  Gunakan Tailwind di HTML sebisa mungkin. File ini untuk override/custom css yg rumit.
*/
`;

// --- WRITE FILES ---

try {
  fs.writeFileSync(path.join(targetDir, `${formattedName}.njk`), njkContent);
  fs.writeFileSync(path.join(targetDir, `${formattedName}.ts`), tsContent);
  fs.writeFileSync(path.join(targetDir, `${formattedName}.css`), cssContent);

  console.log(`\n✅ Berhasil membuat halaman: ${formattedName}`);
  console.log(`📂 Lokasi: src/pages/${formattedName}/`);
  console.log(`   ├── 📄 ${formattedName}.njk  (Extends base.njk)`);
  console.log(`   ├── 📘 ${formattedName}.ts   (Page logic only)`);
  console.log(`   └── 🎨 ${formattedName}.css  (Page style only)`);

} catch (error) {
  console.error('❌ Gagal membuat file:', error);
}