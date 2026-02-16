import i18next from 'i18next';
import { translatePage } from '../i18n';

document.addEventListener('alpine:init', () => {
  Alpine.store('i18n', {
    // State Awal
    current: localStorage.getItem('i18nextLng') || 'id',
    isLoading: false,

    // Action: Ganti Bahasa
    async change(lng) {
      // Cek agar tidak reload bahasa yang sama
      if (this.current === lng) return;

      this.isLoading = true;
      document.documentElement.classList.add('i18n-loading');
      document.documentElement.classList.remove('i18n-ready');

      try {
        // 1. Proses Ganti Bahasa
        await i18next.changeLanguage(lng);

        // 2. Translate halaman (untuk elemen data-i18n)
        await translatePage();

        // 3. Update State (Reactivity Alpine akan mengupdate UI otomatis)
        this.current = lng;
        localStorage.setItem('i18nextLng', lng);

        // 4. Selesai (Delay sedikit untuk UX)
        setTimeout(() => {
          this.isLoading = false;
          document.documentElement.classList.remove('i18n-loading');
          document.documentElement.classList.add('i18n-ready');
        }, 150);
      } catch (error) {
        console.error('[i18n] Switch Failed:', error);
        this.isLoading = false;
        document.documentElement.classList.remove('i18n-loading');
      }
    },
  });
});
