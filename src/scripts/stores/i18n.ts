import {
  getLocaleLabelCountry,
  LOCALE,
  LOCALE_CODES,
  LOCALE_STORAGE_KEY,
  LOCALES,
  NUMBERING_SYSTEM_TO_WRITING_SYSTEM,
  type LocaleCode,
  type NumberingSystemCode,
} from '@/configs/locales';

const getWritingSystem = (ns: NumberingSystemCode): string =>
  NUMBERING_SYSTEM_TO_WRITING_SYSTEM[ns] || 'latin';

export function registerI18nStore(): void {
  if (typeof window === 'undefined' || !globalThis.Alpine) {
    return;
  }

  globalThis.Alpine.store('i18n', {
    languages: LOCALES.map((l) => ({
      code: l.code,
      label: getLocaleLabelCountry(l.code),
      flag: l.flag.toLowerCase(),
    })).filter((l) => LOCALE_CODES.includes(l.code)),

    get current(): string {
      return localStorage.getItem(LOCALE_STORAGE_KEY) || LOCALE.EN_US;
    },

    change(code: string): void {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);

      import('@/scripts/lib/i18n').then((m) => {
        if (m.i18next.isInitialized) {
          m.i18next.changeLanguage(code).then(() => {
            const locale = LOCALES.find((l) => l.code === code);
            if (locale) {
              const htmlEl = document.documentElement;
              htmlEl.setAttribute('lang', code);
              htmlEl.setAttribute('dir', locale.dir);
              htmlEl.setAttribute('data-script', getWritingSystem(locale.numberingSystem));
              htmlEl.classList.toggle('is-rtl', locale.dir === 'rtl');
            }

            m.translatePage();
            m.updateFormattedElements();
            m.updateI18nStoreLabels?.();
          });
        }
      });
    },
  } satisfies {
    languages: Array<{ code: LocaleCode; label: string; flag: string }>;
    current: string;
    change: (code: string) => void;
  });
}
