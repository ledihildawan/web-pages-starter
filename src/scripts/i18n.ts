import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

declare global {
  interface Window {
    changeLanguage: (lng: string) => Promise<void>;
  }
}

/**
 * Fungsi untuk mengambil variabel dari atribut data-i18n-vars
 */
const getVars = (el: Element): Record<string, unknown> => {
  const vars = el.getAttribute('data-i18n-vars');
  try {
    return vars ? (JSON.parse(vars) as Record<string, unknown>) : {};
  } catch (e) {
    console.error('Error parsing i18n vars:', e);
    return {};
  }
};

/**
 * Fungsi utama untuk mengubah teks di DOM
 */
export const translatePage = async (): Promise<void> => {
  // 1. Update Konten Teks & HTML Internal
  const textElements = document.querySelectorAll('[data-i18n]');
  textElements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.innerHTML = i18next.t(key, getVars(el));
    }
  });

  // 2. Update Atribut (Alt, Placeholder, Title)
  const attrElements = document.querySelectorAll('[data-i18n-attr]');
  attrElements.forEach((el) => {
    const raw = el.getAttribute('data-i18n-attr');
    if (raw && raw.includes(':')) {
      const colonIndex = raw.indexOf(':');
      const attrName = raw.substring(0, colonIndex);
      const key = raw.substring(colonIndex + 1);
      el.setAttribute(attrName, i18next.t(key, getVars(el)));
    }
  });

  // 3. Update Status Dokumen
  document.documentElement.lang = i18next.language;
  document.documentElement.classList.remove('i18n-loading');
  document.documentElement.classList.add('i18n-ready');
};

/**
 * Inisialisasi i18next
 */
export const initI18n = async (): Promise<void> => {
  const pageNamespace = document.body.getAttribute('data-page') || 'home';

  try {
    await i18next
      .use(HttpApi)
      .use(LanguageDetector)
      .init({
        fallbackLng: 'id',
        supportedLngs: ['id', 'en'],
        ns: ['common', pageNamespace],
        defaultNS: pageNamespace,
        backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
        },
        interpolation: { escapeValue: false },
      });

    // AMBIL BAHASA AKTIF (Bisa dari localStorage atau deteksi browser)
    const activeLang = i18next.language.split('-')[0]; // Ambil 'en' dari 'en-US'
    const serverLang = document.documentElement.lang;

    // WAJIB jalankan translatePage jika bahasa tidak sama dengan HTML mentah
    if (activeLang !== serverLang) {
      await translatePage();
    }

    // SETELAH TRANSLASI SELESAI, baru buka tirai
    document.documentElement.classList.remove('i18n-loading');
    document.documentElement.classList.add('i18n-ready');

  } catch (error) {
    console.error('i18n Initialization Failed:', error);
    document.documentElement.classList.remove('i18n-loading');
  }
};

/**
 * Global Language Switcher
 */
window.changeLanguage = async (lng: string): Promise<void> => {
  if (i18next.language === lng) return;

  // Pasang kembali blocker saat transisi bahasa
  document.documentElement.classList.add('i18n-loading');
  document.documentElement.classList.remove('i18n-ready');

  try {
    await i18next.changeLanguage(lng);
    await translatePage();
    localStorage.setItem('i18nextLng', lng);
  } catch (error) {
    console.error('Change Language Failed:', error);
    document.documentElement.classList.remove('i18n-loading');
  }
};