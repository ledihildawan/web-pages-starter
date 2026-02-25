# 📖 Dokumentasi: Video Story Component (Macro & Micro Navigation)

Komponen ini adalah pemutar video bergaya *Reels / TikTok / Instagram Story* yang sepenuhnya *customizable*, responsif, dan mendukung multi-format (MP4, YouTube Iframe, dan Gambar). Sistem ini dibangun dengan pola arsitektur **Parent-Child** yang kuat untuk mencegah kebocoran data antar-playlist dan memberikan DX (*Developer Experience*) yang bersih.

## 🚀 1. Arsitektur Dasar (Cara Kerjanya)

Sistem ini membagi navigasi menjadi **Dua Dimensi (2D)**:

1. **Makro Navigasi (Vertical):** Berpindah dari satu daftar putar (*playlist* / *thumbnail*) ke daftar putar lain di dalam grup/kategori yang sama. (Di-*trigger* via tombol Panah Atas/Bawah, Scroll Mouse, atau Swipe Atas/Bawah di HP).
2. **Mikro Navigasi (Horizontal):** Berpindah *slide* atau segmen cerita **hanya di dalam** *thumbnail* yang sedang dibuka. (Di-*trigger* via Tap/Klik area Kiri/Kanan layar).

Untuk mencapai ini, HTML disusun dalam 3 tingkat hierarki yang ketat:

1. `[data-story-group]` **(Wadah Terluar / Kategori):** Mengelompokkan beberapa *thumbnail* agar tidak bocor ke kategori lain.
2. `[data-story-trigger]` **(Thumbnail / Cover):** Kotak yang terlihat di halaman depan dan bisa diklik oleh user. Mewakili 1 daftar putar.
3. `[data-story-item]` **(Slide Data / Database Tersembunyi):** Elemen *invisible* (`display: none`) yang diletakkan di dalam *trigger*. Berisi data aktual (URL video, judul, *views*) yang akan diputar oleh sistem JS.

---

## 🛠️ 2. Cara Penggunaan (Implementasi HTML)

### A. Format Web Story (Banyak Slide dalam 1 Thumbnail)

Format ini cocok untuk promosi (seperti IG Story) di mana 1 kali klik *thumbnail* akan memutar beberapa video/gambar secara berurutan.

* Atur `data-story-format="webstory"` pada *Group*.
* Masukkan banyak elemen `[data-story-item]` ke dalam 1 `[data-story-trigger]`.

```html
<section data-story-group="promo-campaign" data-story-format="webstory">
    
    <div class="video-thumbnail" data-story-trigger>
        <h3>Promo Ramadhan</h3>
        <p>3 Konten Eksklusif</p>
        
        <div style="display: none;">
            <div data-story-item 
                 data-story-id="vid-01" 
                 data-story-type="mp4" 
                 data-story-url="video1.mp4" 
                 data-story-title="Diskon 50%" 
                 data-story-alt="Promo diskon 50 persen"></div>
                 
            <div data-story-item 
                 data-story-id="img-01" 
                 data-story-type="image" 
                 data-story-url="promo.jpg" 
                 data-story-title="Kode Promo" 
                 data-story-alt="Gunakan kode PROMO50"></div>
        </div>
    </div>
</section>

```

### B. Format Default (1 Video = 1 Thumbnail berjejer)

Format ini cocok untuk galeri video standar seperti YouTube Shorts. Jika *user* menswipe ke bawah, ia akan pindah ke *thumbnail* berikutnya di grup tersebut.

* Atur `data-story-format="default"` pada *Group*.
* Buat banyak `[data-story-trigger]`, di mana masing-masing **hanya** memiliki 1 `[data-story-item]`.

```html
<section data-story-group="youtube-playlist" data-story-format="default">
    
    <div class="video-thumbnail" data-story-trigger>
        <h3>Eps 1: Pembukaan</h3>
        <div style="display: none;">
            <div data-story-item 
                 data-story-id="yt-01" 
                 data-story-type="youtube" 
                 data-story-url="https://youtube.com/embed/XXXX" 
                 data-story-title="Episode 1"
                 data-story-alt="Talkshow episode 1"></div>
        </div>
    </div>

    <div class="video-thumbnail" data-story-trigger>
        <h3>Eps 2: Konflik</h3>
        <div style="display: none;">
            <div data-story-item 
                 data-story-id="yt-02" 
                 data-story-type="youtube" 
                 data-story-url="https://youtube.com/embed/YYYY" 
                 data-story-title="Episode 2"
                 data-story-alt="Talkshow episode 2"></div>
        </div>
    </div>
</section>

```

---

## 🗂️ 3. Daftar Atribut Data yang Didukung

Penyisipan data ke JavaScript sepenuhnya diatur melalui *HTML Data Attributes* pada elemen `[data-story-item]`.

| Atribut | Wajib? | Keterangan | Contoh Nilai |
| --- | --- | --- | --- |
| `data-story-item` | Ya | Atribut boolean penanda elemen data. | (kosong) |
| `data-story-id` | Ya | ID unik video. Dipakai untuk *tracking* & URL Parameter (`?video=ID`). | `vid-001` |
| `data-story-type` | Ya | Menentukan *engine* render (`mp4`, `youtube`, atau `image`). | `youtube` |
| `data-story-url` | Ya | Link sumber *file* atau URL embed iframe. | `https://.../video.mp4` |
| `data-story-title` | Ya | Judul video/story yang muncul di UI Player. | `Promo Akhir Tahun` |
| `data-story-alt` | Ya | Teks alternatif untuk aksesibilitas (SEO) di *tag* `<img alt>` atau `<iframe title>`. | `Orang sedang main game` |
| `data-story-views` | Tidak | Angka *dummy* atau riil untuk menampilkan jumlah penonton. | `1.2M` |
| `data-story-desc-content` | Tidak | Deskripsi panjang (mendukung HTML dasar seperti `<p>`). | `<p>Tonton sampai habis!</p>` |

---

## ⚙️ 4. Cara Inisialisasi Script

Panggil file `script.js` di bagian bawah tag `<body>` HTML-mu, lalu cukup panggil *static method* `VideoStoryPlayer.init()`.

```html
    <script src="./script.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            // Skrip otomatis mendeteksi semua elemen [data-story-trigger] di halaman
            VideoStoryPlayer.init();
        });
    </script>
</body>

```

### Auto-Play via URL

Script ini otomatis mendukung fitur *Deep Linking*. Jika URL diakses dengan parameter `?video=vid-001`, maka skrip `init()` akan langsung mencari elemen dengan `data-story-id="vid-001"`, membuka *player*, dan langsung memutar video tersebut.

---

## 📊 5. Integrasi Backend (Analytics)

Sistem sudah dilengkapi dengan fungsi otomatis untuk menembak data statistik ke *backend* ketika format `default` dijalankan. Jika kamu ingin menyesuaikan *endpoint* API-mu, cari fungsi `sendStatistic()` di `script.js`:

```javascript
    sendStatistic() {
        if (!this.data.id) return; 

        var formData = new URLSearchParams();
        // Parameter 'nid' dikirim menyesuaikan kebutuhan Drupal / PHP 
        formData.append('nid', this.data.id); 

        // Ganti URL ini dengan API Endpoint milikmu
        fetch('/core/modules/statistics/statistics.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        }).catch(err => console.log('Gagal mengirim statistik:', err));
    }

```