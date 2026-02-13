Teknik yang baru saja kita terapkan disebut **Inline Hydration** (atau kadang disebut *Inner-wrap Pattern*). Ini adalah pendekatan yang sangat seimbang antara kenyamanan menulis kode (*Developer Experience*) dan fungsionalitas aplikasi modern.

Berikut adalah rincian teknik tersebut serta beberapa alternatif teknik lainnya dalam dunia *web development* dan *internationalization* (i18n):

---

### 1. Inline Hydration (Inner-wrap Pattern)

Ini adalah teknik yang baru saja kita gunakan di proyekmu.

* **Cara Kerja:** Tag HTML ditulis secara manual di template (`<h1>`, `<p>`, `<a>`), sedangkan fungsi penerjemah (macro `t`) diletakkan di dalam tag tersebut untuk menghasilkan elemen *inline* (seperti `<span>`) yang membawa kunci terjemahan.
* **Digunakan dalam hal:** Proyek yang mengutamakan kecepatan pengembangan (DX), kemudahan membaca kode, dan SEO, namun tetap membutuhkan fitur ganti bahasa secara *real-time* di sisi klien (browser).

---

### 2. Component Wrapping (Outer-wrap Pattern)

Teknik ini adalah yang sempat kita coba di awal, di mana seluruh elemen HTML dihasilkan oleh fungsi/macro.

* **Cara Kerja:** Kamu memanggil fungsi seperti `{{ i18n.t(key, tag='h1') }}` dan fungsi tersebut mencetak tag `<h1>` beserta isinya sekaligus.
* **Digunakan dalam hal:** Proyek dengan standarisasi komponen yang sangat ketat (Design System). Cocok jika kamu ingin memastikan semua judul (`h1`) di seluruh website memiliki *class* CSS yang identik tanpa harus menulis ulang *class* Tailwind-nya berkali-kali.

---

### 3. Key-based Attribution (Attribute-only)

Teknik yang hanya menempelkan "tanda" pada atribut tag HTML tanpa mengubah isinya di sisi server.

* **Cara Kerja:** Kamu menulis `<h1 data-i18n="hero.title"></h1>`. Saat halaman dimuat, JavaScript akan mencari semua elemen dengan atribut `data-i18n` dan mengisi teksnya.
* **Digunakan dalam hal:** *Client-side Only Apps* atau aplikasi yang sangat bergantung pada JavaScript (seperti Single Page Application/SPA).
* **Kelemahan:** Buruk untuk SEO karena saat Google bot datang, tag `<h1>` tersebut terlihat kosong sebelum JavaScript berjalan.

---

### 4. Static Site Generation (SSG) per Language

Teknik yang memisahkan folder berdasarkan bahasa.

* **Cara Kerja:** Kamu membuat build yang berbeda untuk setiap bahasa. Hasilnya adalah folder `/id/` dan `/en/`.
* **Digunakan dalam hal:** Website statis berskala besar yang ingin performa maksimal. Tidak ada proses "ganti bahasa" secara *real-time* tanpa pindah halaman (refresh). Setiap kali ganti bahasa, user benar-benar pindah ke URL yang berbeda.

---

### Perbandingan Ringkas

| Teknik | Kelebihan | Kekurangan |
| --- | --- | --- |
| **Inline Hydration** | Kode sangat bersih, HTML native, SEO bagus. | Ada tambahan tag `<span>` di dalam HTML. |
| **Component Wrap** | Konsistensi tinggi (Design System). | Kode template sulit dibaca jika atribut banyak. |
| **Attribute-only** | Sangat dinamis (JS-heavy). | Buruk untuk SEO (teks kosong di awal). |
| **Static SSG** | Performa tercepat. | Harus *refresh* halaman untuk ganti bahasa. |

### Kesimpulan untuk Proyekmu:

Teknik **Inline Hydration** yang kita pilih adalah yang paling pas karena kamu sedang membangun *template engine* yang ingin terlihat "bersih" bagi orang lain yang nanti akan menggunakannya, tapi tetap ingin fitur modern seperti ganti bahasa instan tanpa refresh.

Apakah kamu ingin mencoba menerapkan teknik ini pada bagian **Meta Tags** agar SEO website kamu juga otomatis mendukung multi-bahasa?