// registerI18nStore.js
import Alpine from 'alpinejs';
import i18next from 'i18next';
import { translatePage } from '../i18n';

export const registerI18nStore = () => {
  Alpine.store('i18n', {
    current: localStorage.getItem('i18nextLng') || i18next.language || 'id',
    isChanging: false,
    
    // Tambahkan properti 'flag' sesuai kode negara Flagpedia
    languages: [
      { code: 'id', label: 'Bahasa Indonesia', flag: 'id' },
      { code: 'en-US', label: 'English (US)', flag: 'us' },
      { code: 'ja', label: '日本語', flag: 'jp' },
      { code: 'zh-CN', label: '简体中文', flag: 'cn' },
      { code: 'ar', label: 'العربية', flag: 'sa' } // Saudi Arabia sebagai representasi visual standar RTL
    ],

    init() {
      this.syncAttributes(this.current);
    },

    syncAttributes(lng) {
      const isRtl = lng.startsWith('ar');
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    },

    async change(lng) {
      if (this.current === lng || this.isChanging) return;
      this.isChanging = true;
      document.documentElement.classList.replace('i18n-ready', 'i18n-loading');

      try {
        await i18next.changeLanguage(lng);
        await translatePage();
        this.current = lng;
        this.syncAttributes(lng);
        localStorage.setItem('i18nextLng', lng);
        
        setTimeout(() => {
          this.isChanging = false;
          document.documentElement.classList.replace('i18n-loading', 'i18n-ready');
        }, 150);
      } catch (err) {
        this.isChanging = false;
        document.documentElement.classList.add('i18n-ready');
      }
    }
  });
};