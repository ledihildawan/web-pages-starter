# 🏗️ Proyek MPA Architecture Guide

Dokumen ini menjelaskan visi teknis dan aturan main dalam mengelola struktur proyek ini. Kita menggunakan prinsip **Convention over Configuration**: dengan mengikuti struktur folder yang ada, sistem build akan mengurus integrasi aset secara otomatis.

## 📖 Prinsip Utama

* **Upgrading Problems**: Menukar masalah manual (lupa pasang script/link) dengan masalah sistem (menjaga konsistensi folder).
* **Locality of Behavior (LOB)**: Setiap halaman bersifat mandiri. Menghapus folder halaman berarti menghapus seluruh jejak kode (JSON, TS, CSS) tanpa menyisakan sampah di area global.
* **Zero-Touch Automation**: Aset lokal (`index.ts`, `index.css`) dan data (`index.json`) otomatis terdeteksi dan disuntikkan oleh sistem build ke dalam template.



## 📂 Struktur Folder & Aturan Main

### 1. src/layouts/ (Arsitektur Visual)
* **root.njk**: Kerangka HTML paling dasar (`<html>`, `<head>`, `<body>`). Ini adalah *one-way door* yang jarang berubah.
* **Domain Layouts**: Layout khusus fungsi bisnis (e.g., `public/main.njk`, `auth/simple.njk`). Jangan mencampur logika Dashboard ke dalam layout Public.
* **shared/**: Berisi fragmen kecil (*partials*) seperti `head.njk` atau `foot.njk`.

### 2. src/pages/ (Rute & Otomatisasi)
Setiap folder di sini mewakili rute URL. Sistem build secara otomatis memetakan aset jika menggunakan nama file standar:
* **index.njk**: Struktur HTML halaman (Entry Point).
* **index.json**: Data lokal yang otomatis disuntikkan ke template Nunjucks.
* **index.ts**: Logika JS/TS khusus halaman (Otomatis disuntikkan di akhir body).
* **index.css**: Style khusus halaman (Otomatis disuntikkan di dalam head).



### 3. src/styles/ & src/scripts/ (Global Assets)
* **main.css**: Global Design System (Tailwind, CSS Variables, Reset). Muncul di semua halaman.
* **main.ts**: Global Glue Code (Inisialisasi library, menu navigasi global). Muncul di semua halaman.

## 🛠️ Panduan Operasional

| Tugas | Perintah / Tindakan |
| :--- | :--- |
| **Tambah Halaman Baru** | Jalankan `bun gen [nama-halaman]`. |
| **Integrasi Aset** | Cukup buat file `index.ts` atau `index.css` di folder halaman. **Jangan** import manual di template. |
| **Manajemen Data** | Update `index.json` untuk konten halaman, atau `data/global.json` untuk info situs. |
| **Pembersihan** | Gunakan `bun run clean` untuk mereset `dist` dan `node_modules`. |



## ⚠️ Aturan Penting (Jangan Dilanggar)

1.  **Standardisasi Nama**: File utama wajib bernama `index` (e.g., `index.njk`). Mengganti nama akan merusak deteksi otomatis di `rsbuild.config.ts`.
2.  **Domain Isolation**: Jangan memanggil CSS halaman `dashboard` di halaman `public`. Jika butuh gaya yang sama, pindahkan ke `src/styles/main.css`.
3.  **No Manual Linking**: Hindari penggunaan tag `<link>` atau `<script>` manual di template untuk file lokal. Biarkan Rsbuild yang menangani *hashing* dan *injection*.

> "Arsitektur yang baik adalah tentang secara sengaja menukar masalah yang Anda miliki hari ini, dengan masalah yang lebih baik besok." — Matthew Hawthorne.