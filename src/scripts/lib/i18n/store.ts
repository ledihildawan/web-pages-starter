import { getLocaleLabelCountry, LOCALE_STORAGE_KEY } from './index';
import { LOCALE, LOCALE_CODES, LOCALES, type LocaleCode } from './data';
import { DIRECTION_CODE } from './directions';

const updateDocumentAttributes = (code: string): void => {
  const locale = LOCALES.find((l) => l.code === code);
  if (!locale) return;

  const htmlEl = document.documentElement;
  htmlEl.setAttribute('lang', code);
  htmlEl.setAttribute('dir', locale.dir);
  htmlEl.setAttribute('data-script', locale.writingSystem);
  htmlEl.classList.toggle('is-rtl', locale.dir === DIRECTION_CODE.RTL);
};

const refreshFonts = async (): Promise<void> => {
  const fonts = await import('./fonts');
  fonts.setupFontStackCSS();
  fonts.loadLanguageFonts();
  fonts.loadFallbackFonts();
};

const changeLanguage = async (code: string): Promise<void> => {
  const m = await import('./runtime');
  if (!m.i18next.isInitialized) return;

  await m.i18next.changeLanguage(code);
  updateDocumentAttributes(code);
  m.translatePage();
  m.updateFormattedElements();
  m.updateI18nStoreLabels?.();
  await refreshFonts();
};

export function registerI18nStore(): void {
  if (typeof window === 'undefined' || !globalThis.Alpine) return;

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
      void changeLanguage(code).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[i18n change] failed:', message);
      });
    },
  } satisfies {
    languages: Array<{ code: LocaleCode; label: string; flag: string }>;
    current: string;
    change: (code: string) => void;
  });
}
