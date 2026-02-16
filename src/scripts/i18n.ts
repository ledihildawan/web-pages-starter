import Alpine from 'alpinejs'; // Pastikan install: npm install alpinejs
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import resourcesToBackend from 'i18next-resources-to-backend';

// Helper untuk mengambil variabel data-i18n-vars
const getVars = (el: Element): Record<string, unknown> => {
  try {
    const vars = el.getAttribute('data-i18n-vars');
    return vars ? JSON.parse(vars) : {};
  } catch {
    return {};
  }
};

// Fungsi untuk menerjemahkan elemen statis (non-Alpine)
export const translatePage = async (): Promise<void> => {
  const currentLng = i18next.language ? i18next.language.split('-')[0] : 'id';

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      // 1. Terjemahkan elemen teks utama
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) el.innerHTML = i18next.t(key, getVars(el));
      });

      // 2. Terjemahkan atribut (placeholder, alt, title, dll)
      document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        const raw = el.getAttribute('data-i18n-attr');
        if (raw?.includes(':')) {
          const [attr, key] = raw.split(':');
          el.setAttribute(attr, i18next.t(key, getVars(el)));
        }
      });

      // 3. Logika RTL/LTR & Lang Attribute
      document.documentElement.lang = currentLng;
      document.documentElement.dir = currentLng === 'ar' ? 'rtl' : 'ltr';

      resolve();
    });
  });
};

// Inisialisasi Utama
export const initI18n = async (): Promise<void> => {
  const pageNS =
    window.__PAGE_ID__ || document.body.getAttribute('data-page') || 'home';
  const usedComps = window.__USED_COMPONENTS__ || [];
  const compNS = usedComps.map((n) => `components/${n}`);
  const defaultLang = 'id';

  try {
    await i18next
      .use(LanguageDetector)
      .use(
        resourcesToBackend((lng: string, _ns: string) => {
          if (lng === defaultLang) return {};
          return null; // Gunakan backend lain jika null
        }),
      )
      .use(HttpApi)
      .init({
        fallbackLng: defaultLang,
        supportedLngs: ['id', 'en', 'jp', 'cn', 'ar'],
        ns: ['common', pageNS, ...compNS],
        defaultNS: pageNS,
        backend: {
          loadPath: (lngs: string[], namespaces: string[]) =>
            `/assets/locales/${lngs[0]}-${namespaces[0].replace(/\//g, '-')}.json`,
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
        },
        interpolation: { escapeValue: false },
      });

    // Update state awal Alpine setelah i18next siap
    const activeLang = i18next.language.split('-')[0];

    // Kita akses store secara langsung (jika Alpine sudah init)
    // atau biarkan Alpine mengambil state awal dari localStorage
    if (activeLang !== defaultLang) {
      await translatePage();
    }

    // Hapus loading screen
    document.documentElement.classList.remove('i18n-loading');
    document.documentElement.classList.add('i18n-ready');
  } catch (error) {
    console.error('[i18n] Init Failed:', error);
    document.documentElement.classList.remove('i18n-loading');
  }
};
