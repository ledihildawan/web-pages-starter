import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'src/locales');

const data404 = {
  heading: "404",
  subheading: "Halaman Tidak Ditemukan",
  description: "Sepertinya halaman yang Anda cari tidak ada atau telah dipindahkan.",
  button_text: "Kembali ke Beranda",
  or_try: "Atau coba:"
};

const aboutData = {
  hero: {
    badge: "Tentang Kami",
    title_part1: "Digerakkan oleh ",
    title_highlight: "passion",
    description: "Perjalanan kami dimulai dengan ide sederhana."
  },
  mission: {
    title: "Misi Kami",
    description: "Memberdayakan pengembang dan bisnis dengan alat yang elegan, cepat, dan mudah digunakan untuk membangun produk digital yang luar biasa."
  },
  vision: {
    title: "Visi Kami",
    description: "Menjadi platform pilihan untuk pengembang modern yang menghargai keindahan, performa, dan pengalaman pengguna di setiap baris kode."
  },
  story: {
    tag: "Cerita Kami",
    visual_label: "Ilustrasi Studio Kreatif",
    title: "Digerakkan oleh passion, <br>didefinisikan oleh keunggulan.",
    para1: "Perjalanan kami dimulai dengan ide sederhana: membuat pengembangan web dapat diakses dan menyenangkan untuk semua orang. Kami sudah lelah dengan framework yang berat dan konfigurasi yang rumit.",
    para2: "Hari ini, kami adalah tim yang beragam dari engineer, desainer, dan pemikir yang bekerja sama untuk memecahkan masalah kompleks dengan solusi yang elegan.",
    val1: "Filosofi desain user-centric",
    val2: "Arsitektur performance-first",
    val3: "Transparansi dan komunikasi terbuka"
  },
  values: {
    title: "Nilai-Nilai Kami",
    subtitle: "Prinsip yang memandu setiap keputusan yang kami buat."
  },
  passion: {
    title: "Passion",
    description: "Kami mencintai apa yang kami lakukan, dan itu terlihat di setiap detail produk kami."
  },
  collaboration: {
    title: "Kolaborasi",
    description: "Bekerja sama menghasilkan hasil terbaik. Kami percaya pada kekuatan tim yang solid."
  },
  innovation: {
    title: "Inovasi",
    description: "Selalu mencari cara yang lebih baik untuk memecahkan masalah dan menciptakan nilai."
  },
  integrity: {
    title: "Integritas",
    description: "Kejujuran dan transparansi adalah fondasi setiap hubungan yang kami bangun."
  },
  excellence: {
    title: "Keunggulan",
    description: "Kami tidak puas dengan cukup baik. Kami selalu berusaha untuk yang terbaik."
  },
  quality: {
    title: "Kualitas",
    description: "Kode yang bersih, desain yang indah, dan pengalaman yang seamless adalah standar kami."
  },
  team: {
    title: "Kenali Tim",
    subtitle: "Pikiran cemerlang di balik setiap baris kode yang kami tulis.",
    alex_desc: "Pemimpin visioner dengan pengalaman 10+ tahun dalam pengembangan ekosistem SaaS.",
    sarah_desc: "Full-stack wizard yang mengkhususkan diri dalam membangun arsitektur sistem berskala besar.",
    mike_desc: "Terobsesi dengan detail pixel, alur UX yang halus, dan standar aksesibilitas.",
    jessica_desc: "Pencerita kreatif yang membantu merek menemukan suara unik mereka di dunia digital."
  },
  stats: {
    years: "Tahun Pengalaman",
    years_val: "3+",
    clients: "Klien Global",
    clients_val: "120+",
    countries: "Negara yang Dijangkau",
    countries_val: "15",
    support: "Support Ahli",
    support_val: "24/7"
  }
};

const locales = fs.readdirSync(LOCALES_ROOT).filter(f =>
  fs.statSync(path.join(LOCALES_ROOT, f)).isDirectory()
);

console.log(`Creating 404.json5 and about.json5 for ${locales.length} locales...\n`);

for (const locale of locales.sort()) {
  const localeDir = path.join(LOCALES_ROOT, locale);

  const path404 = path.join(localeDir, '404.json5');
  fs.writeFileSync(path404, JSON.stringify(data404, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ ${locale}/404.json5`);

  const pathAbout = path.join(localeDir, 'about.json5');
  fs.writeFileSync(pathAbout, JSON.stringify(aboutData, null, 2) + '\n', 'utf-8');
  console.log(`  ✓ ${locale}/about.json5`);
}

console.log(`\nDone! Created 2 files each for ${locales.length} locales (${locales.length * 2} total).`);
console.log('Run `bun run gen:i18n` to regenerate i18n types.');