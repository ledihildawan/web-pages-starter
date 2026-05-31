import {
  LANGUAGES as ALL_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANG_CODES,
} from '@/configs/locales';

interface Language {
  code: string;
  label: string;
  flag: string;
}

// Use languages from config
const LANGUAGES: Language[] = ALL_LANGUAGES.map((l) => ({
  code: l.code,
  label: l.label,
  flag: l.flag,
}));

export function registerIntlStore() {
  if (typeof window === 'undefined') {
    return;
  }

  // Alpine must be available
  if (!globalThis.Alpine) {
    return;
  }

  globalThis.Alpine.store('i18n', {
    languages: LANGUAGES.filter((l) =>
      SUPPORTED_LANG_CODES.includes(l.code as any),
    ),

    get current() {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en-US';
    },

    change(code: string) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      window.location.reload();
    },
  });
}
