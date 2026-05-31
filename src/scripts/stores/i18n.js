import { SUPPORTED_LANG_CODES, LANGUAGE_STORAGE_KEY, LANGUAGES as ALL_LANGUAGES } from '@/configs/locales';

// Use languages from config
const LANGUAGES = ALL_LANGUAGES.map(l => ({
  code: l.code,
  label: l.label,
  flag: l.flag
}));

export function registerI18nStore() {
  if (typeof window === 'undefined') {
    return;
  }

  // Alpine must be available
  if (!globalThis.Alpine) {
    return;
  }

  globalThis.Alpine.store('i18n', {
    languages: LANGUAGES.filter(l => SUPPORTED_LANG_CODES.includes(l.code)),

    get current() {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en-US';
    },

    change(code) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      window.location.reload();
    }
  });
}
