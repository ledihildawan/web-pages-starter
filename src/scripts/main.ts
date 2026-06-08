const isProd = process.env.NODE_ENV === "production";

const deferTask = (fn: () => void, timeout = 2000): void => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, 0);
  }
};

const deferred = (): void => {
  import("./lib/i18n/fonts")
    .then((fonts) => {
      fonts.setupFontStackCSS();
      fonts.loadLanguageFonts();
      fonts.loadFallbackFonts();
      fonts.watchScriptAndLoadFont();
    })
    .catch(() => { });
};

const registerServiceWorker = (): void => {
  if (!isProd || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Service worker registration failed:", message);
  });
};

async function bootstrap() {
  try {
    const [{ registerI18nStore }, Alpine] = await Promise.all([
      import("./lib/i18n/store"),
      import("alpinejs").then((m) => m.default),
    ]);

    globalThis.Alpine = Alpine;
    registerI18nStore();

    Alpine.start();

    deferTask(deferred);

    import("./lib/i18n/fonts").then(({ preloadActiveFont }) =>
      preloadActiveFont(),
    );
    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Bootstrap failed:", message);
  }
}


void bootstrap();
