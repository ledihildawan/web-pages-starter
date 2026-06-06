import {
  loadFallbackFonts,
  loadLanguageFonts,
  preloadActiveFont,
  setupFontStackCSS,
  watchScriptAndLoadFont,
} from "./lib/font-loader";

type VendorModules = Awaited<ReturnType<typeof loadVendors>>;
type AppModules = Awaited<ReturnType<typeof loadAppModules>>;

const isProd = process.env.NODE_ENV === "production";

const loadVendors = async () => {
  const [AlpineModule, collapse, focus] = await Promise.all([
    import("alpinejs"),
    import("@alpinejs/collapse"),
    import("@alpinejs/focus"),
  ]);

  return {
    Alpine: AlpineModule.default,
    collapse: collapse.default,
    focus: focus.default,
  };
};

const loadAppModules = async () => {
  const [{ initIntl }, { registerI18nStore }, { registerNavbarComponent }] =
    await Promise.all([
      import("./lib/i18n"),
      import("./stores/i18n"),
      import("./components/navbar"),
    ]);

  return {
    initIntl,
    registerI18nStore,
    registerNavbarComponent,
  };
};

const setupAlpine = ({ Alpine, collapse, focus }: VendorModules): void => {
  globalThis.Alpine = Alpine;
  Alpine.plugin(collapse);
  Alpine.plugin(focus);
};

const registerAppModules = ({
  registerI18nStore,
  registerNavbarComponent,
}: AppModules): void => {
  registerI18nStore();
  registerNavbarComponent();
};

const clearStartupLocks = (): void => {
  document.body.classList.remove("no-scroll");
  document.body.style.insetBlockStart = "";
  document.documentElement.style.removeProperty("--scrollbar-width");
};

const loadFonts = (): void => {
  setupFontStackCSS();
  loadLanguageFonts();
  loadFallbackFonts();
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
    const [vendors, appModules] = await Promise.all([
      loadVendors(),
      loadAppModules(),
    ]);

    setupAlpine(vendors);
    registerAppModules(appModules);
    await appModules.initIntl();

    clearStartupLocks();

    vendors.Alpine.start();

    preloadActiveFont();
    loadFonts();
    watchScriptAndLoadFont();
    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Bootstrap failed:", message);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  void bootstrap();
}
