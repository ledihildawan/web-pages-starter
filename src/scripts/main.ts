const isProd = process.env.NODE_ENV === 'production';

const deferTask = (fn: () => void, timeout = 2000): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, 0);
  }
};

const deferred = (): void => {
  import('../../packages/i18n/fonts/fonts')
    .then((fonts) => {
      fonts.setupFontStackCSS();
      fonts.loadLanguageFonts();
      fonts.watchScriptAndLoadFont();
    })
    .catch(() => {});
};

const registerServiceWorker = (): void => {
  if (!isProd || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register(`${import.meta.env.BASE_PATH}sw.js`)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Warning: Service worker registration failed —', message);
    });
};

async function bootstrap() {
  try {
    const [{ registerI18nStore }, Alpine] = await Promise.all([
      import('../../packages/i18n/runtime/store'),
      import('alpinejs').then((m) => m.default),
    ]);

    globalThis.Alpine = Alpine;
    registerI18nStore();

    Alpine.start();

    const { i18next, initIntl } = await import(
      '../../packages/i18n/runtime/runtime'
    );
    if (!i18next.isInitialized) {
      const locale = window.__SAVED_LOCALE__ || window.__SERVER_LOCALE__;
      await initIntl(locale);
    }

    deferTask(deferred);

    import('../../packages/i18n/fonts/fonts').then(({ preloadActiveFont }) =>
      preloadActiveFont(),
    );
    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Bootstrap failed —', message);
  }
}

void bootstrap();
