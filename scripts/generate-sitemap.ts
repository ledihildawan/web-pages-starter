import fs from 'node:fs';
import path from 'node:path';

// GANTI DENGAN DOMAIN ASLI ANDA NANTI
const BASE_URL = 'https://technomira.com'; 

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const PAGES_DIR = path.resolve(process.cwd(), 'src/pages');

console.log('🗺️  Generating Sitemap...');

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

if (fs.existsSync(PAGES_DIR)) {
  const pages = fs.readdirSync(PAGES_DIR);
  
  pages.forEach((page) => {
    // Abaikan folder sistem (.) atau file bukan folder
    if (page.startsWith('.') || !fs.statSync(path.join(PAGES_DIR, page)).isDirectory()) return;

    // 🔥 2. FILTER BARU: Jangan masukkan halaman 404 ke sitemap
    if (page === '404') return;

    // Handle homepage (index) vs halaman lain
    const slug = (page === 'index' || page === 'home') ? '' : page;
    const url = `${BASE_URL}/${slug}`;
    const lastMod = new Date().toISOString().split('T')[0];

    xml += `  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${slug === '' ? '1.0' : '0.8'}</priority>
  </url>
`;
  });
}

xml += `</urlset>`;

// Pastikan folder dist ada
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml);
console.log('✅ Sitemap generated at dist/sitemap.xml');