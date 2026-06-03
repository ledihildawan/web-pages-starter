import '@fontsource/inter/900.css';
import { NUMBERING_SYSTEM_CODE, type NumberingSystemCode } from '@/configs/locales';
import { getLocale, getNativeNumberingSystem } from './utils/locale';

type FontLoader = () => Promise<unknown>;

type VendorModules = Awaited<ReturnType<typeof loadVendors>>;
type AppModules = Awaited<ReturnType<typeof loadAppModules>>;

const LANGUAGE_FONT_LOADERS: Readonly<Partial<Record<NumberingSystemCode, FontLoader>>> = {
  [NUMBERING_SYSTEM_CODE.JPAN]: () => import('@fontsource-variable/noto-sans-jp/index.css'),
  [NUMBERING_SYSTEM_CODE.HANS]: () => import('@fontsource-variable/noto-sans-sc/index.css'),
  [NUMBERING_SYSTEM_CODE.HANT]: () => import('@fontsource-variable/noto-sans-tc/index.css'),
  [NUMBERING_SYSTEM_CODE.ARAB]: () => import('@fontsource-variable/noto-sans-arabic/index.css'),
  [NUMBERING_SYSTEM_CODE.DEVA]: () => import('@fontsource-variable/noto-sans/index.css'),
  [NUMBERING_SYSTEM_CODE.KORE]: () => import('@fontsource-variable/noto-sans-kr/index.css'),
  [NUMBERING_SYSTEM_CODE.CYRL]: () => Promise.all([
    import('@fontsource/inter/cyrillic-400.css'),
    import('@fontsource/inter/cyrillic-700.css'),
    import('@fontsource/inter/cyrillic-900.css'),
  ]),
  [NUMBERING_SYSTEM_CODE.THAI]: () => import('@fontsource-variable/noto-sans-thai/index.css'),
};

const isProd = process.env.NODE_ENV === 'production';

const getIsSlowConnection = (): boolean => {
  const conn = navigator.connection;
  return !!conn?.saveData || ['slow-2g', '2g', '3g', '4g'].includes(conn?.effectiveType ?? '');
};

const loadFont = async (loader: FontLoader | undefined): Promise<void> => {
  if (!loader) return;

  try {
    await loader();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Font loading failed:', message);
  }
};

const loadLanguageFonts = (): void => {
  const nativeNumberingSystem = getNativeNumberingSystem(getLocale());

  if (nativeNumberingSystem in LANGUAGE_FONT_LOADERS) {
    void loadFont(LANGUAGE_FONT_LOADERS[nativeNumberingSystem as NumberingSystemCode]);
  }
};

const loadSecondaryFonts = (): void => {
  if (getIsSlowConnection()) return;

  void loadFont(() => Promise.all([
    import('@fontsource/inter/400.css'),
    import('@fontsource/inter/700.css'),
  ]));
};

const loadVendors = async () => {
  const [AlpineModule, collapse, focus] = await Promise.all([
    import('alpinejs'),
    import('@alpinejs/collapse'),
    import('@alpinejs/focus'),
  ]);

  return {
    Alpine: AlpineModule.default,
    collapse: collapse.default,
    focus: focus.default,
  };
};

const loadAppModules = async () => {
  const [
    { initIntl },
    { registerI18nStore },
    { registerNavbarComponent },
  ] = await Promise.all([
    import('./lib/i18n'),
    import('./stores/i18n'),
    import('./components/navbar'),
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
  document.body.classList.remove('no-scroll');
  document.body.style.insetBlockStart = '';
  document.documentElement.style.removeProperty('--scrollbar-width');
};

const loadFonts = (): void => {
  loadLanguageFonts();
  loadSecondaryFonts();
};

const registerServiceWorker = (): void => {
  if (!isProd || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Service worker registration failed:', message);
  });
};

async function bootstrap() {
  try {
    const [vendors, appModules] = await Promise.all([
      loadVendors(),
      loadAppModules()
    ]);

    setupAlpine(vendors);
    registerAppModules(appModules);
    await appModules.initIntl();

    clearStartupLocks();

    vendors.Alpine.start();

    loadFonts();
    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Bootstrap failed:', message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  void bootstrap();
}