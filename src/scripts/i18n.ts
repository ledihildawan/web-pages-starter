
import { DEFAULT_LANG, SUPPORTED_LANG_CODES } from '@configs/languages';
import i18next, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const getVars = (el: Element): Record<string, unknown> => {
  try {
    const vars = el.getAttribute('data-i18n-vars');
    return vars ? JSON.parse(vars) : {};
  } catch {
    return {};
  }
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

  for (const lng of Object.keys(rawData)) {
    const data = rawData[lng];
    resources[lng] = {
      common: (data.common || (lng === 'id' ? data : {})) as Record<string, string>,
      [pageID]: (data.page || {}) as Record<string, string>,
    };

    if (data.comp) {
      for (const compName of Object.keys(data.comp)) {
        resources[lng][`components/${compName}`] = data.comp[compName] as Record<string, string>;
      }
    }
  }

  try {
    await i18next.use(LanguageDetector).init({
      resources,
      fallbackLng: DEFAULT_LANG,
      supportedLngs: SUPPORTED_LANG_CODES,
      ns: ['common', pageID],
      defaultNS: 'common',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng', 
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