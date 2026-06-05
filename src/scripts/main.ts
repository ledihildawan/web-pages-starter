import type { NumberingSystemCode, WritingSystemCode } from '@/configs/locales';
import {
  getWritingSystem,
  NUMBERING_SYSTEM_CODE,
  NUMBERING_SYSTEM_TO_WRITING_SYSTEM,
  WRITING_SYSTEM,
} from '@/configs/locales';
import { getLanguageConfig, getLocale, getNativeNumberingSystem } from './utils/locale';

type FontLoader = () => Promise<unknown>;

type VendorModules = Awaited<ReturnType<typeof loadVendors>>;
type AppModules = Awaited<ReturnType<typeof loadAppModules>>;

type FontWeightList = readonly number[];

type FontConfig = {
  name: string;
  family: string;
  variants: {
    default: FontWeightList;
    cyrillic?: FontWeightList;
  };
};

type FontStack = {
  primary: FontConfig;
  secondary?: FontConfig;
  monospace?: FontConfig;
};

const FONT_STACK: FontStack = {
  primary: {
    name: 'inter',
    family: 'Inter',
    variants: {
      default: [400, 500, 600, 700, 800, 900],
      cyrillic: [400, 500, 600, 700, 800, 900],
    },
  },
};

const getFontWeights = (
  writingSystemCode: WritingSystemCode,
  fontConfig: FontConfig,
): readonly [FontWeightList, 'cyrillic-' | ''] | null => {
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
  writingSystemCode: WritingSystemCode,
  fontConfig: FontConfig,
): FontLoader | null => {
  const result = getFontWeights(writingSystemCode, fontConfig);

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

const createPrimaryLoader = (
  writingSystemCode: WritingSystemCode,
): FontLoader => {
  const loader = createFontLoader(writingSystemCode, FONT_STACK.primary);
  if (!loader) {
    throw new Error(
      `Font "${FONT_STACK.primary.name}" not available for writing system: ${writingSystemCode}`,
    );
  }
  return loader;
};

const LANGUAGE_FONT_LOADERS: Readonly<
  Partial<Record<NumberingSystemCode, FontLoader>>
> = {
  [NUMBERING_SYSTEM_CODE.LATN]: createPrimaryLoader(WRITING_SYSTEM.LATIN),
  [NUMBERING_SYSTEM_CODE.JPAN]: () =>
    import('@fontsource-variable/noto-sans-jp/index.css'),
  [NUMBERING_SYSTEM_CODE.HANS]: () =>
    import('@fontsource-variable/noto-sans-sc/index.css'),
  [NUMBERING_SYSTEM_CODE.HANT]: () =>
    import('@fontsource-variable/noto-sans-tc/index.css'),
  [NUMBERING_SYSTEM_CODE.KORE]: () =>
    import('@fontsource-variable/noto-sans-kr/index.css'),
  [NUMBERING_SYSTEM_CODE.CYRL]: createPrimaryLoader(WRITING_SYSTEM.CYRILLIC),
  [NUMBERING_SYSTEM_CODE.HEBR]: createPrimaryLoader(WRITING_SYSTEM.HEBREW),
  [NUMBERING_SYSTEM_CODE.GREK]: createPrimaryLoader(WRITING_SYSTEM.GREEK),
  [NUMBERING_SYSTEM_CODE.ARAB]: () =>
    import('@fontsource-variable/noto-sans-arabic/index.css'),
  [NUMBERING_SYSTEM_CODE.DEVA]: () =>
    Promise.all([
      import('@fontsource/noto-sans-devanagari/400.css'),
      import('@fontsource/noto-sans-devanagari/500.css'),
      import('@fontsource/noto-sans-devanagari/600.css'),
      import('@fontsource/noto-sans-devanagari/700.css'),
    ]),
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

export const loadLanguageFonts = (): void => {
  const nativeNumberingSystem = getNativeNumberingSystem(getLocale());

  if (nativeNumberingSystem in LANGUAGE_FONT_LOADERS) {
    void loadFont(
      LANGUAGE_FONT_LOADERS[nativeNumberingSystem as NumberingSystemCode],
    );
  }
};

export const loadFallbackFonts = (): void => {
  const nativeNumberingSystem = getNativeNumberingSystem(getLocale());
  const writingSystemCode = NUMBERING_SYSTEM_TO_WRITING_SYSTEM[
    nativeNumberingSystem as NumberingSystemCode
  ] as WritingSystemCode | undefined;

  if (getIsSlowConnection()) return;

  if (
    writingSystemCode === WRITING_SYSTEM.LATIN ||
    writingSystemCode === WRITING_SYSTEM.HEBREW ||
    writingSystemCode === WRITING_SYSTEM.GREEK ||
    writingSystemCode === WRITING_SYSTEM.CYRILLIC
  )
    return;

  const weights = FONT_STACK.primary.variants.default;

  void loadFont(() =>
    Promise.all(
      weights.map(
        (weight) =>
          import(`@fontsource/${FONT_STACK.primary.name}/${weight}.css`),
      ),
    ),
  );
};

export const setupFontStackCSS = (): void => {
  const root = document.documentElement;
  const locale = getLanguageConfig(getLocale());
  const writingSystem = locale
    ? getWritingSystem(locale.writingSystem)
    : undefined;

  const primaryFont = writingSystem?.defaultFont ?? FONT_STACK.primary.family;
  root.style.setProperty('--font-primary', primaryFont);
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
  setupFontStackCSS();
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
