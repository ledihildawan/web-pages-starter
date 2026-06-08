import './components/features.css';

(async () => {
  try {
    const { i18next, initIntl, t } = await import('@/scripts/lib/i18n/runtime');

    const log = (lng: string) => {
      console.log('[i18n] locale:', lng);
      console.log('[i18n] home:hero.primary_btn.label =', t('home:hero.primary_btn.label'));
    };

    if (!i18next.isInitialized) {
      const locale = window.__SAVED_LOCALE__ || window.__SERVER_LOCALE__;
      await initIntl(locale);
    }
    log(i18next.language);
    i18next.on('languageChanged', log);
  } catch { }
})();

