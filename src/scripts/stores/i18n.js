import Alpine from 'alpinejs';
import i18next from 'i18next';
import {
  DEFAULT_LANG,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
} from '@/configs/locales';
import { getDirection } from '../utils/locale';
import { translatePage, t as translate } from '../libs/i18n';

export const registerI18nStore = () => {
  Alpine.store('i18n', {
    current:
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
      i18next.language ||
      DEFAULT_LANG,

    isChanging: false,
    languages: LANGUAGES,

    t: translate,

    init() {
      this.syncAttributes(this.current);
    },

    syncAttributes(lng) {
      const dir = getDirection(lng);

      document.documentElement.dir = dir;
      document.documentElement.lang = lng;

      if (dir === 'rtl') {
        document.documentElement.classList.add('is-rtl');
      } else {
        document.documentElement.classList.remove('is-rtl');
      }
    },

    async change(lng) {
      if (this.current === lng || this.isChanging) return;

      this.isChanging = true;

      try {
        await i18next.changeLanguage(lng);
        await translatePage();

        this.current = lng;
        this.syncAttributes(lng);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);

        this.isChanging = false;
      } catch (err) {
        this.isChanging = false;
      }
    },
  });
};
