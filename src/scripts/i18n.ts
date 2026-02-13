import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const initI18n = async () => {
  const pageNamespace = document.body.getAttribute('data-page') || 'common';

  await i18next
    .use(HttpApi)
    .use(LanguageDetector)
    .init({
      fallbackLng: 'id',
      supportedLngs: ['id', 'en'],
      ns: ['common', pageNamespace],
      defaultNS: 'common',
      backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

  translatePage();
};

export const translatePage = () => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.innerHTML = i18next.t(key);
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const attrData = el.getAttribute('data-i18n-attr');
    if (attrData) {
      const [attr, key] = attrData.split(':');
      el.setAttribute(attr, i18next.t(key));
    }
  });

  document.body.classList.add('i18n-ready');
  document.documentElement.lang = i18next.language;
};

// TODO: Change to better dx
(window as any).changeLanguage = async (lng: string) => {
  await i18next.changeLanguage(lng);
  
  translatePage();
};