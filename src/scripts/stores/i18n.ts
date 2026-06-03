import {
  getLocaleLabelCountry,
  LOCALE,
  LOCALE_CODES,
  LOCALE_STORAGE_KEY,
  LOCALES,
  type LocaleCode,
} from '@/configs/locales';

export function registerI18nStore(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!globalThis.Alpine) {
    return;
  }

  globalThis.Alpine.store('i18n', {
    languages: LOCALES.map((l) => ({
      code: l.code,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag,
    })).filter((l) => LOCALE_CODES.includes(l.code)),

    get current(): string {
      return localStorage.getItem(LOCALE_STORAGE_KEY) || LOCALE.EN_US;
    },

    change(code: string): void {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      window.location.reload();
    },
  } satisfies {
    languages: Array<{ code: LocaleCode; label: string; flag: string }>;
    current: string;
    change: (code: string) => void;
  });
}
