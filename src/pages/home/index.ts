import './components/features.css';

(async () => {
  try {
    const { i18next } = await import('@/scripts/lib/i18n/runtime');

    i18next.on('languageChanged', () => {});
  } catch {}
})();
