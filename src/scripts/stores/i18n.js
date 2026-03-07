import Alpine from 'alpinejs';
import i18next from 'i18next';
import { translatePage } from '../i18n';

export const registerI18nStore = () => {
  Alpine.store('i18n', {
    // Ambil bahasa dari i18next atau localStorage saat inisialisasi
    current: localStorage.getItem('i18nextLng') || i18next.language?.split('-')[0] || 'id',
    isChanging: false,

    async change(lng) {
      if (this.current === lng || this.isChanging) return;

      this.isChanging = true;
      // Tambahkan kelas loading di HTML untuk efek transisi halus
      document.documentElement.classList.replace('i18n-ready', 'i18n-loading');

      try {
        await i18next.changeLanguage(lng);
        await translatePage();

        // UPDATE STATE: Ini yang memicu perubahan teks di Navbar secara otomatis
        this.current = lng;
        localStorage.setItem('i18nextLng', lng);

        setTimeout(() => {
          this.isChanging = false;
          document.documentElement.classList.replace('i18n-loading', 'i18n-ready');
        }, 150);
      } catch (err) {
        console.error('[i18n Store] Switch Error:', err);
        this.isChanging = false;
        document.documentElement.classList.add('i18n-ready');
      }
    },
  });
};