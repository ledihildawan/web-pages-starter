
import { DEFAULT_LOCALE, LOCALE_CODES, LOCALE_FALLBACKS, LOCALE_STORAGE_KEY, type LocaleCode } from '@/configs/locales';
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

/**
 * Get fallback chain for a locale using explicit fallbacks or smart defaults
 * Priority: explicit fallback → language-script-region → language → default
 */
const getFallbackForLocale = (locale: string): string[] => {
  const localeCode = locale as LocaleCode;
  if (LOCALE_CODES.includes(localeCode)) return [localeCode];

  // Check explicit fallbacks (e.g., zh-Hans-MY → zh-Hans-CN → en-US)
  const explicit = LOCALE_FALLBACKS[localeCode];
  if (explicit) return [explicit, DEFAULT_LOCALE];

  // For Chinese script variants without explicit fallback
  if (locale.startsWith('zh-')) {
    const parts = locale.split('-');
    if (parts.length >= 2) {
      // Try zh-Hans → zh-Hans-CN or zh-Hant → zh-Hant-TW
      const scriptBase = parts.slice(0, 2).join('-');
      const scriptFallback = LOCALE_CODES.find(c => c.startsWith(scriptBase));
      if (scriptFallback) return [scriptFallback, DEFAULT_LOCALE];
    }
  }

  // For other language variants, try to find base locale
  const parts = locale.split('-');
  const languageSubtag = parts[0];

  // Try language-region match first (e.g., en-AU → en-GB)
  const matched = LOCALE_CODES.find((c) => {
    const cParts = c.split('-');
    return cParts[0] === languageSubtag && cParts.length > 1;
  });

  if (matched) return [matched, DEFAULT_LOCALE];

  return [DEFAULT_LOCALE];
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

  for (const locale of Object.keys(rawData)) {
    const data = rawData[locale];
    resources[locale] = {
      common: (data.common || {}) as Record<string, string>,
      [pageID]: (data.page || {}) as Record<string, string>,
    };

    if (data.comp) {
      for (const compName of Object.keys(data.comp)) {
        resources[locale][`components/${compName}`] = data.comp[compName] as Record<string, string>;
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