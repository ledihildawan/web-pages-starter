import i18next, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LOCALE_FALLBACKS, LOCALE_STORAGE_KEY } from '@/configs/locales';
import {
  DEFAULT_LOCALE,
  LOCALE_CODES,
  type LocaleCode,
} from '@/configs/locales/data';

const getVars = (el: Element): Record<string, unknown> => {
  try {
    const vars = el.getAttribute('data-i18n-vars');
    return vars ? JSON.parse(vars) : {};
  } catch {
    return {};
  }
};

const getChineseScriptFallback = (locale: string): string[] | null => {
  if (!locale.startsWith('zh-')) return null;

  const [, script] = locale.split('-');
  const scriptBase = `zh-${script}`;
  const scriptFallback = LOCALE_CODES.find((code) =>
    code.startsWith(scriptBase),
  );

  return scriptFallback ? [scriptFallback, DEFAULT_LOCALE] : null;
};

const getLanguageRegionFallback = (locale: string): string[] | null => {
  const [language] = locale.split('-');
  const matched = LOCALE_CODES.find((code) => {
    const [codeLang] = code.split('-');
    return codeLang === language && code.includes('-');
  });

  return matched ? [matched, DEFAULT_LOCALE] : null;
};

const getFallbackForLocale = (locale: string): string[] => {
  const localeCode = locale as LocaleCode;
  if (LOCALE_CODES.includes(localeCode)) return [localeCode];

  const explicitFallback = LOCALE_FALLBACKS[localeCode];
  if (explicitFallback) return [explicitFallback, DEFAULT_LOCALE];

  return (
    getChineseScriptFallback(locale) ||
    getLanguageRegionFallback(locale) || [DEFAULT_LOCALE]
  );
};

export const translatePage = async (): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          el.innerHTML = i18next.t(key, getVars(el)) as string;
        }
      });

      document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        const raw = el.getAttribute('data-i18n-attr');
        if (raw?.includes(':')) {
          const firstColon = raw.indexOf(':');
          const attrName = raw.slice(0, firstColon);
          const key = raw.slice(firstColon + 1);
          el.setAttribute(attrName, i18next.t(key, getVars(el)) as string);
        }
      });

      resolve();
    });
  });
};

export const initI18n = async (): Promise<void> => {
  const pageID = window.__PAGE_ID__ || 'home';
  const rawData = window.__I18N_DATA__ || {};
  const resources: Resource = {};

  for (const locale of Object.keys(rawData) as LocaleCode[]) {
    const data = rawData[locale];
    resources[locale] = {
      common: (data.common || {}) as unknown as Record<string, string>,
      [pageID]: (data.page || {}) as Record<string, string>,
    };

    if (data.comp) {
      for (const compName of Object.keys(data.comp)) {
        resources[locale][`components/${compName}`] = data.comp[
          compName as keyof typeof data.comp
        ] as Record<string, string>;
      }
    }
  }

  try {
    await i18next.use(LanguageDetector).init({
      resources,
      fallbackLng: getFallbackForLocale,
      supportedLngs: LOCALE_CODES,
      ns: ['common', pageID],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
      },
      interpolation: {
        escapeValue: false,
      },
    });

    await translatePage();

    document.documentElement.classList.replace('i18n-loading', 'i18n-ready');
  } catch (error) {
    console.error('[i18n Init Error]:', error);
    document.documentElement.classList.remove('i18n-loading');
  }
};
