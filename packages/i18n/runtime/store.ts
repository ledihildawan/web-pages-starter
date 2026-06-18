import { i18nConfig } from '@config/i18n';
import { getActiveLocalesDisplay, LOCALE_STORAGE_KEY } from '@i18n';
import type { LocaleCode } from '@i18n/data/locales';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { setStrategies } from '@i18n/engine/formatters';
import { getLanguageSubtag } from '@i18n/engine/helpers';
import { loadStrategies } from '@i18n/strategies/loader';
import { env } from '@utils/env';
import { scheduleTask } from '@utils/microtask-queue';

const updateDocumentAttributes = (code: string): void => {
  const locale = getActiveLocales().find((l) => l.code === code);
  if (!locale) return;

  const htmlEl = document.documentElement;
  htmlEl.setAttribute('lang', code);
  htmlEl.setAttribute('dir', locale.dir);
  htmlEl.setAttribute('data-script', locale.writingSystem);
  htmlEl.classList.toggle('is-rtl', locale.dir === 'rtl');
};

const refreshFonts = async (): Promise<void> => {
  const fonts = await import('../fonts/fonts');
  fonts.loadLanguageFonts();
};

const MAX_LOADED_LOCALES = 5;
const loadedLocales = new Set<string>();

const ensureLocaleData = async (code: string, pageID: string, m: typeof import('./runtime')): Promise<void> => {
  if (m.i18next.hasResourceBundle(code, 'common')) return;

  try {
    const response = await fetch(`${env.BASE_PATH}assets/i18n/${pageID}/${code}.json`);
    const data = await response.json();
    for (const [ns, bundle] of Object.entries(data as Record<string, Record<string, string>>)) {
      m.i18next.addResourceBundle(code, ns, bundle);
    }
    loadedLocales.add(code);

    while (loadedLocales.size > MAX_LOADED_LOCALES) {
      const oldest = loadedLocales.values().next().value;
      if (!oldest || oldest === code) break;
      loadedLocales.delete(oldest);
      m.i18next.removeResourceBundle(oldest, 'common');
      m.i18next.removeResourceBundle(oldest, pageID);
    }
  } catch {
    console.warn(`[i18n] Failed to load locale: ${code}`);
  }
};

const changeLanguage = async (code: string): Promise<void> => {
  const m = await import('./runtime');

  if (!m.i18next.isInitialized) {
    await m.initIntl(code);
  } else {
    const pageID = window.__PAGE_ID__;
    await ensureLocaleData(code, pageID, m);
    await m.i18next.changeLanguage(code);
    m.clearMissingKeys();
    const strategies = await loadStrategies(getLanguageSubtag(code as LocaleCode));
    setStrategies(strategies.cardinal, strategies.ordinal);
    scheduleTask(() => m.translatePage());
    scheduleTask(() => m.updateFormattedElements());
    scheduleTask(() => m.updateI18nStoreLabels?.());
  }

  updateDocumentAttributes(code);
  await refreshFonts();
};

export function registerI18nStore(): void {
  if (typeof window === 'undefined' || !globalThis.Alpine) return;

  globalThis.Alpine.store('i18n', {
    languages: getActiveLocalesDisplay(),

    current: localStorage.getItem(LOCALE_STORAGE_KEY) || i18nConfig.defaultLocale,

    change(code: string): void {
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      this.current = code;
      void changeLanguage(code).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error: [i18n] change failed —', message);
      });
    },
  } satisfies {
    languages: Array<{ code: string; label: string; flag: string }>;
    current: string;
    change: (code: string) => void;
  });
}
