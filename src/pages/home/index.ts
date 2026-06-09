import './components/features.css';

(async () => {
  try {
    const { i18next, t } = await import('@/scripts/lib/i18n/runtime');

    const log = (lng: string) => {
    };

    log(i18next.language);
    i18next.on('languageChanged', log);
  } catch { }
})();
