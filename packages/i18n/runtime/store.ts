import { i18nConfig } from '@config/i18n';
import { ASSET_PATHS } from '@core/asset-paths';
import { env } from '@generated/env';
import { DEFAULT_NAMESPACE, getActiveLocalesDisplay, LOCALE_STORAGE_KEY } from '@i18n';
import type { LocaleCode } from '@i18n/data/locales';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { setStrategies } from '@i18n/engine/formatters';
import { getLanguageSubtag } from '@i18n/engine/helpers';
import { loadStrategies } from '@i18n/strategies/loader';
import { defineStore } from '@utils/alpine';
import { scheduleTask } from '@core/microtask-queue';

export interface i18nStoreLanguages {
  code: LocaleCode;
  label: string;
  flag: string;
}

export interface i18nStore {
  current: string;
  languages: i18nStoreLanguages[];
  loadedLocales: Set<string>;
  maxLoadedLocales: number;
  change: (locale: string) => Promise<void>;
  refreshFonts: () => void;
  changeLanguage: (code: string) => void;
  ensureLocaleData: (code: string, pageID: string, m: typeof import('./runtime')) => Promise<void>;
  updateDocumentAttributes: (code: string) => void;
}

export default defineStore('i18n', {
  current: localStorage.getItem(LOCALE_STORAGE_KEY) || i18nConfig.defaultLocale,
  languages: getActiveLocalesDisplay(),
  loadedLocales: new Set<string>(),
  maxLoadedLocales: 5,

  updateDocumentAttributes(code: string) {
    const locale = getActiveLocales().find((l) => l.code === code);
    if (!locale) return;

    const htmlEl = document.documentElement;

    htmlEl.setAttribute('lang', code);
    htmlEl.setAttribute('dir', locale.dir);
    htmlEl.setAttribute('data-script', locale.writingSystem);

    htmlEl.classList.toggle('is-rtl', locale.dir === 'rtl');
  },

  async refreshFonts() {
    const fonts = await import('../fonts/fonts');

    fonts.loadLanguageFonts();
  },

  async ensureLocaleData(code: string, pageID: string, m: typeof import('./runtime')) {
    if (m.i18next.hasResourceBundle(code, DEFAULT_NAMESPACE)) return;

    try {
      const response = await fetch(`${env.BASE_PATH}${ASSET_PATHS.locales}/${code}/${pageID}.json`);
      const data = await response.json();

      for (const [ns, bundle] of Object.entries(data)) {
        m.i18next.addResourceBundle(code, ns, bundle);
      }

      this.loadedLocales.add(code);

      while (this.loadedLocales.size > this.maxLoadedLocales) {
        const oldest = this.loadedLocales.values().next().value;

        if (!oldest || oldest === code) break;

        this.loadedLocales.delete(oldest);

        m.i18next.removeResourceBundle(oldest, DEFAULT_NAMESPACE);
        m.i18next.removeResourceBundle(oldest, pageID);
      }
    } catch {
      console.warn(`[i18n] Failed to load locale: ${code}`);
    }
  },

  async changeLanguage(code: string) {
    const mod = await import('./runtime');

    if (!mod.i18next.isInitialized) {
      await mod.initIntl(code);
    } else {
      const pageID = window.__PAGE_ID__;

      await this.ensureLocaleData(code, pageID, mod);

      await mod.i18next.changeLanguage(code);

      mod.clearMissingKeys();

      const strategies = await loadStrategies(getLanguageSubtag(code as LocaleCode));

      setStrategies(strategies.cardinal, strategies.ordinal);

      scheduleTask(() => mod.translatePage());
      scheduleTask(() => mod.updateFormattedElements());
      scheduleTask(() => mod.updateI18nStoreLabels?.());
    }

    this.updateDocumentAttributes(code);

    await this.refreshFonts();
  },

  async change(code: string) {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);

    this.current = code;

    try {
      await this.changeLanguage(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      console.error('Error: [i18n] change failed —', message);
    }
  },
});
