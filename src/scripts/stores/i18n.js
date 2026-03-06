import Alpine from 'alpinejs';
import i18next from 'i18next';
import { translatePage } from '../i18n';

export const registerI18nStore = () => {
  Alpine.store('i18n', {
    current: i18next.language?.split('-')[0] || 'id',
    isChanging: false,

    async change(lng) {
      if (this.current === lng || this.isChanging) return;

      this.isChanging = true;
      document.documentElement.classList.replace('i18n-ready', 'i18n-loading');

      try {
        await i18next.changeLanguage(lng);
        await translatePage();

        this.current = lng;
        localStorage.setItem('i18nextLng', lng);

        setTimeout(() => {
          this.isChanging = false;
          document.documentElement.classList.replace(
            'i18n-loading',
            'i18n-ready',
          );
        }, 150);
      } catch (err) {
        console.error('[i18n Store] Switch Error:', err);
        this.isChanging = false;
        document.documentElement.classList.add('i18n-ready');
      }
    },
  });
};
