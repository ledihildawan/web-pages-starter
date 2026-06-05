import type { NumberingSystemCode, WritingSystemCode } from '@/configs/locales';
import {
  NUMBERING_SYSTEM_CODE,
  NUMBERING_SYSTEMS,
  WRITING_SYSTEM,
} from '@/configs/locales';
import { getLocale, getNativeNumberingSystem } from './utils/locale';

type FontLoader = () => Promise<unknown>;

type VendorModules = Awaited<ReturnType<typeof loadVendors>>;
type AppModules = Awaited<ReturnType<typeof loadAppModules>>;

type FontWeightList = readonly [number, number, number, number, number, number];

type FontConfig = {
  name: string;
  variants: {
    default: FontWeightList;
    cyrillic?: FontWeightList;
  };
};

const DEFAULT_FONT: FontConfig = {
  name: 'inter',
  variants: {
    default: [400, 500, 600, 700, 800, 900] as const,
    cyrillic: [400, 500, 600, 700, 800, 900] as const,
  },
};

const getFontWeights = (
  numberingSystem: NumberingSystemCode,
  fontConfig: FontConfig = DEFAULT_FONT,
): readonly [FontWeightList, 'cyrillic-' | ''] | null => {
  const nsConfig = NUMBERING_SYSTEMS.find((ns) => ns.code === numberingSystem);
  if (!nsConfig) return null;

  const writingSystemCode = nsConfig.writingSystem as WritingSystemCode;

  if (
    writingSystemCode === WRITING_SYSTEM.LATIN ||
    writingSystemCode === WRITING_SYSTEM.GREEK ||
    writingSystemCode === WRITING_SYSTEM.HEBREW
  ) {
    return [fontConfig.variants.default, ''];
  }

  if (
    writingSystemCode === WRITING_SYSTEM.CYRILLIC &&
    fontConfig.variants.cyrillic
  ) {
    return [fontConfig.variants.cyrillic, 'cyrillic-'];
  }

  return null;
};

const createFontLoader = (
  numberingSystem: NumberingSystemCode,
  fontConfig: FontConfig = DEFAULT_FONT,
): FontLoader | null => {
  const result = getFontWeights(numberingSystem, fontConfig);

  if (result === null) {
    return null;
  }

  const [weights, variant] = result;
  const fontName = fontConfig.name;

  const imports = weights.map((weight) =>
    variant === 'cyrillic-'
      ? import(`@fontsource/${fontName}/cyrillic-${weight}.css`)
      : import(`@fontsource/${fontName}/${weight}.css`),
  );

  return () => Promise.all(imports);
};

const createFontLoaderOrThrow = (
  numberingSystem: NumberingSystemCode,
  fontConfig: FontConfig = DEFAULT_FONT,
): FontLoader => {
  const loader = createFontLoader(numberingSystem, fontConfig);
  if (!loader) {
    throw new Error(
      `Font "${fontConfig.name}" not available for numbering system: ${numberingSystem}`,
    );
  }
  return loader;
};

const LANGUAGE_FONT_LOADERS: Readonly<
  Partial<Record<NumberingSystemCode, FontLoader>>
> = {
  [NUMBERING_SYSTEM_CODE.LATN]: createFontLoaderOrThrow(
    NUMBERING_SYSTEM_CODE.LATN,
  ),

  [NUMBERING_SYSTEM_CODE.JPAN]: () =>
    import('@fontsource-variable/noto-sans-jp/index.css'),
  [NUMBERING_SYSTEM_CODE.HANS]: () =>
    import('@fontsource-variable/noto-sans-sc/index.css'),
  [NUMBERING_SYSTEM_CODE.HANT]: () =>
    import('@fontsource-variable/noto-sans-tc/index.css'),
  [NUMBERING_SYSTEM_CODE.KORE]: () =>
    import('@fontsource-variable/noto-sans-kr/index.css'),

  [NUMBERING_SYSTEM_CODE.CYRL]: createFontLoaderOrThrow(
    NUMBERING_SYSTEM_CODE.CYRL,
  ),

  [NUMBERING_SYSTEM_CODE.HEBR]: createFontLoaderOrThrow(
    NUMBERING_SYSTEM_CODE.HEBR,
  ),
  [NUMBERING_SYSTEM_CODE.GREK]: createFontLoaderOrThrow(
    NUMBERING_SYSTEM_CODE.GREK,
  ),

  [NUMBERING_SYSTEM_CODE.ARAB]: () =>
    import('@fontsource-variable/noto-sans-arabic/index.css'),

  [NUMBERING_SYSTEM_CODE.DEVA]: () =>
    import('@fontsource-variable/noto-sans/index.css'),
  [NUMBERING_SYSTEM_CODE.BENG]: () =>
    import('@fontsource-variable/noto-sans-bengali/index.css'),
  [NUMBERING_SYSTEM_CODE.TAML]: () =>
    import('@fontsource-variable/noto-sans-tamil/index.css'),
  [NUMBERING_SYSTEM_CODE.TELU]: () =>
    import('@fontsource-variable/noto-sans-telugu/index.css'),
  [NUMBERING_SYSTEM_CODE.KNADA]: () =>
    import('@fontsource-variable/noto-sans-kannada/index.css'),
  [NUMBERING_SYSTEM_CODE.MLYM]: () =>
    import('@fontsource-variable/noto-sans-malayalam/index.css'),
  [NUMBERING_SYSTEM_CODE.GUJR]: () =>
    import('@fontsource-variable/noto-sans-gujarati/index.css'),
  [NUMBERING_SYSTEM_CODE.GURU]: () =>
    import('@fontsource-variable/noto-sans-gurmukhi/index.css'),
  [NUMBERING_SYSTEM_CODE.SINH]: () =>
    import('@fontsource-variable/noto-sans-sinhala/index.css'),

  [NUMBERING_SYSTEM_CODE.THAI]: () =>
    import('@fontsource-variable/noto-sans-thai/index.css'),
  [NUMBERING_SYSTEM_CODE.KHMR]: () =>
    import('@fontsource-variable/noto-sans-khmer/index.css'),
  [NUMBERING_SYSTEM_CODE.LAOO]: () =>
    import('@fontsource-variable/noto-sans-lao/index.css'),
  [NUMBERING_SYSTEM_CODE.MYM]: () =>
    import('@fontsource-variable/noto-sans-myanmar/index.css'),

  [NUMBERING_SYSTEM_CODE.GEOR]: () =>
    import('@fontsource-variable/noto-sans-georgian/index.css'),
  [NUMBERING_SYSTEM_CODE.ETHI]: () =>
    import('@fontsource-variable/noto-sans-ethiopic/index.css'),
  [NUMBERING_SYSTEM_CODE.ARMN]: () =>
    import('@fontsource-variable/noto-sans-armenian/index.css'),
};

const isProd = process.env.NODE_ENV === 'production';

const getIsSlowConnection = (): boolean => {
  const conn = navigator.connection;
  return (
    !!conn?.saveData ||
    ['slow-2g', '2g', '3g', '4g'].includes(conn?.effectiveType ?? '')
  );
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
    void loadFont(
      LANGUAGE_FONT_LOADERS[nativeNumberingSystem as NumberingSystemCode],
    );
  }
};

const loadFallbackFonts = (): void => {
  const nativeNumberingSystem = getNativeNumberingSystem(getLocale());

  if (getIsSlowConnection()) return;

  if (
    nativeNumberingSystem === NUMBERING_SYSTEM_CODE.LATN ||
    nativeNumberingSystem === NUMBERING_SYSTEM_CODE.HEBR ||
    nativeNumberingSystem === NUMBERING_SYSTEM_CODE.GREK ||
    nativeNumberingSystem === NUMBERING_SYSTEM_CODE.CYRL
  )
    return;

  const fontConfig = DEFAULT_FONT;
  const weights = fontConfig.variants.default;

  void loadFont(() =>
    Promise.all(
      weights.map(
        (weight) => import(`@fontsource/${fontConfig.name}/${weight}.css`),
      ),
    ),
  );
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
  const [{ initIntl }, { registerI18nStore }, { registerNavbarComponent }] =
    await Promise.all([
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
  loadFallbackFonts();
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
      loadAppModules(),
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
