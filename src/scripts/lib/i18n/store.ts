import { i18nConfig } from '../../../configs/i18n';
import { ROOT_PAGE } from '../../../configs/pages';
import { scheduleTask } from '../utils/microtask-queue';
import { getActiveLocales } from './active-locales';
import { getActiveLocalesDisplay, LOCALE_STORAGE_KEY } from './index';

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
  const fonts = await import('./fonts');
  fonts.setupFontStackCSS();
  fonts.loadLanguageFonts();
};

const ensureLocaleData = async (
  code: string,
  pageID: string,
  m: typeof import('./runtime'),
): Promise<void> => {
  if (m.i18next.hasResourceBundle(code, 'common')) return;

  try {
    const response = await fetch(
      `${import.meta.env.BASE_PATH}assets/i18n/${pageID}/${code}.json`,
    );
    const data = await response.json();
    const compData = data.comp
      ? Object.fromEntries(
          Object.entries(data.comp).map(([name, content]) => [
            `components.${name}`,
            content,
          ]),
        )
      : {};
    m.i18next.addResourceBundle(code, 'common', data.common);
    m.i18next.addResourceBundle(code, pageID, data.page);
    for (const [ns, bundle] of Object.entries(compData)) {
      m.i18next.addResourceBundle(code, ns, bundle as Record<string, string>);
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
    const pageID = (window.__PAGE_ID__ ?? ROOT_PAGE) as string;
    await ensureLocaleData(code, pageID, m);
    await m.i18next.changeLanguage(code);
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

    current:
      localStorage.getItem(LOCALE_STORAGE_KEY) || i18nConfig.defaultLocale,

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
