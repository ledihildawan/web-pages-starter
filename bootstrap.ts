import { deferTask } from '@utils/scheduler';

const registerServiceWorker = (): void => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register(`${import.meta.env.BASE_PATH}sw.js`).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Service worker registration failed —', message);
  });
};

async function bootstrap() {
  try {
    const [{ registerI18nStore }, Alpine] = await Promise.all([
      import('@i18n/runtime/store'),
      import('alpinejs').then((m) => m.default),
    ]);

    globalThis.Alpine = Alpine;
    registerI18nStore();

    const { i18next, initIntl } = await import('@i18n/runtime/runtime');
    if (!i18next.isInitialized) {
      const locale = window.__SAVED_LOCALE__ || window.__SERVER_LOCALE__;
      await initIntl(locale);
    }

    Alpine.start();

    import('@i18n/fonts/fonts')
      .then((fonts) => {
        fonts.preloadActiveFont();
        deferTask(() => {
          fonts.setupFontStackCSS();
          fonts.loadLanguageFonts();
          fonts.watchScriptAndLoadFont();
        });
      })
      .catch(() => {});

    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Bootstrap failed —', message);
  }
}

void bootstrap();
