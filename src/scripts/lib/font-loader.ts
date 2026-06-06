import { FONT_STACK, type FontConfig } from '@/configs/fonts';
import { LOCALES, type LocaleConfig } from '@/configs/locales/data';
import { NUMBERING_SYSTEMS, type NumberingSystemCode } from '@/configs/locales/numbering-systems';
import { WRITING_SYSTEM_CODE, type WritingSystemCode } from '@/configs/locales/writing-systems';

import '@fontsource-variable/noto-sans';

type FontLoader = () => Promise<unknown>;
type FontWeightList = readonly number[];

function getFontWeights(
  writingSystemCode: WritingSystemCode,
  fontConfig: FontConfig,
): readonly [FontWeightList, 'cyrillic-' | ''] | null {
  if (
    writingSystemCode === WRITING_SYSTEM_CODE.LATIN ||
    writingSystemCode === WRITING_SYSTEM_CODE.GREEK ||
    writingSystemCode === WRITING_SYSTEM_CODE.HEBREW
  ) {
    return [fontConfig.variants.default, ''];
  }

  if (
    writingSystemCode === WRITING_SYSTEM_CODE.CYRILLIC &&
    fontConfig.variants.cyrillic
  ) {
    return [fontConfig.variants.cyrillic, 'cyrillic-'];
  }

  return null;
}

function createFontLoader(
  writingSystemCode: WritingSystemCode,
  fontConfig: FontConfig,
): FontLoader | null {
  const result = getFontWeights(writingSystemCode, fontConfig);

  if (result === null) return null;

  const [weights, variant] = result;
  const fontName = fontConfig.name;

  const imports = weights.map((weight) =>
    variant === 'cyrillic-'
      ? import(`@fontsource/${fontName}/cyrillic-${weight}.css`)
      : import(`@fontsource/${fontName}/${weight}.css`),
  );

  return () => Promise.all(imports);
}

function createPrimaryLoader(writingSystemCode: WritingSystemCode): FontLoader {
  const loader = createFontLoader(writingSystemCode, FONT_STACK.primary);
  if (!loader) {
    throw new Error(
      `Font "${FONT_STACK.primary.name}" not available for writing system: ${writingSystemCode}`,
    );
  }
  return loader;
}

// NOTE: Each path appears twice — once as `css` and once inside the loader's
// `import()` call. The loader MUST have a literal string for Rsbuild/Rspack to
// code-split into per-font chunks. Using `import(constVariable)` merges all
// fonts into one chunk (~226 kB CSS, loaded on initial page).
const NOTO_SANS: Partial<
  Record<NumberingSystemCode, { css: string; loader: FontLoader }>
> = {
  jpan: {
    css: '@fontsource-variable/noto-sans-jp/index.css',
    loader: () => import('@fontsource-variable/noto-sans-jp/index.css'),
  },
  hans: {
    css: '@fontsource-variable/noto-sans-sc/index.css',
    loader: () => import('@fontsource-variable/noto-sans-sc/index.css'),
  },
  hant: {
    css: '@fontsource-variable/noto-sans-tc/index.css',
    loader: () => import('@fontsource-variable/noto-sans-tc/index.css'),
  },
  kore: {
    css: '@fontsource-variable/noto-sans-kr/index.css',
    loader: () => import('@fontsource-variable/noto-sans-kr/index.css'),
  },
  arab: {
    css: '@fontsource-variable/noto-sans-arabic/index.css',
    loader: () => import('@fontsource-variable/noto-sans-arabic/index.css'),
  },
  deva: {
    css: '@fontsource/noto-sans-devanagari/400.css',
    loader: () => import('@fontsource/noto-sans-devanagari/400.css'),
  },
  thai: {
    css: '@fontsource-variable/noto-sans-thai/index.css',
    loader: () => import('@fontsource-variable/noto-sans-thai/index.css'),
  },
  beng: {
    css: '@fontsource-variable/noto-sans-bengali/index.css',
    loader: () => import('@fontsource-variable/noto-sans-bengali/index.css'),
  },
  taml: {
    css: '@fontsource-variable/noto-sans-tamil/index.css',
    loader: () => import('@fontsource-variable/noto-sans-tamil/index.css'),
  },
  telu: {
    css: '@fontsource-variable/noto-sans-telugu/index.css',
    loader: () => import('@fontsource-variable/noto-sans-telugu/index.css'),
  },
  knda: {
    css: '@fontsource-variable/noto-sans-kannada/index.css',
    loader: () => import('@fontsource-variable/noto-sans-kannada/index.css'),
  },
  mlym: {
    css: '@fontsource-variable/noto-sans-malayalam/index.css',
    loader: () => import('@fontsource-variable/noto-sans-malayalam/index.css'),
  },
  gujr: {
    css: '@fontsource-variable/noto-sans-gujarati/index.css',
    loader: () => import('@fontsource-variable/noto-sans-gujarati/index.css'),
  },
  guru: {
    css: '@fontsource-variable/noto-sans-gurmukhi/index.css',
    loader: () => import('@fontsource-variable/noto-sans-gurmukhi/index.css'),
  },
  sinh: {
    css: '@fontsource-variable/noto-sans-sinhala/index.css',
    loader: () => import('@fontsource-variable/noto-sans-sinhala/index.css'),
  },
  khmr: {
    css: '@fontsource-variable/noto-sans-khmer/index.css',
    loader: () => import('@fontsource-variable/noto-sans-khmer/index.css'),
  },
  laoo: {
    css: '@fontsource-variable/noto-sans-lao/index.css',
    loader: () => import('@fontsource-variable/noto-sans-lao/index.css'),
  },
  mymr: {
    css: '@fontsource-variable/noto-sans-myanmar/index.css',
    loader: () => import('@fontsource-variable/noto-sans-myanmar/index.css'),
  },
  geor: {
    css: '@fontsource-variable/noto-sans-georgian/index.css',
    loader: () => import('@fontsource-variable/noto-sans-georgian/index.css'),
  },
  ethi: {
    css: '@fontsource-variable/noto-sans-ethiopic/index.css',
    loader: () => import('@fontsource-variable/noto-sans-ethiopic/index.css'),
  },
  armn: {
    css: '@fontsource-variable/noto-sans-armenian/index.css',
    loader: () => import('@fontsource-variable/noto-sans-armenian/index.css'),
  },
};

const SCRIPT_FONT_LOADERS: Partial<Record<NumberingSystemCode, FontLoader>> =
  Object.fromEntries(
    Object.entries(NOTO_SANS).map(([ns, { loader }]) => [
      ns as NumberingSystemCode,
      loader,
    ]),
  );

const SCRIPT_FONT_CSS: Partial<Record<NumberingSystemCode, string>> =
  Object.fromEntries(
    Object.entries(NOTO_SANS).map(([ns, { css }]) => [
      ns as NumberingSystemCode,
      css,
    ]),
  );

Object.assign(SCRIPT_FONT_LOADERS, {
  cyrl: createPrimaryLoader(WRITING_SYSTEM_CODE.CYRILLIC),
  hebr: createPrimaryLoader(WRITING_SYSTEM_CODE.HEBREW),
  grek: createPrimaryLoader(WRITING_SYSTEM_CODE.GREEK),
});

const preloaded = new Set<NumberingSystemCode>();
const loaded = new Set<NumberingSystemCode>();

function getCurrentLang(): string | null {
  return document.documentElement.getAttribute('lang');
}

function findLocale(lang: string): LocaleConfig | undefined {
  return LOCALES.find((l) => l.code === lang || lang.startsWith(`${l.code}-`));
}

function getNumberingSystemConfig(nsCode: NumberingSystemCode) {
  return NUMBERING_SYSTEMS.find((n) => n.code === nsCode);
}

function handleLoadError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fonts] ${context}:`, message);
}

function loadFontForLang(lang: string | null, mode: 'preload' | 'dynamic'): void {
  if (!lang) return;

  const locale = findLocale(lang);
  const ns = locale?.nativeNumberingSystem;
  if (!ns) return;

  if (mode === 'preload') {
    const css = SCRIPT_FONT_CSS[ns];
    if (!css || preloaded.has(ns)) return;
    preloaded.add(ns);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = css;
    document.head.appendChild(link);
    return;
  }

  const loader = SCRIPT_FONT_LOADERS[ns];
  if (!loader || loaded.has(ns)) return;
  loaded.add(ns);
  loader().catch((err: unknown) => handleLoadError(`load failed for "${ns}"`, err));
}

function isLatinBased(writingSystem: WritingSystemCode): boolean {
  return (
    writingSystem === WRITING_SYSTEM_CODE.LATIN ||
    writingSystem === WRITING_SYSTEM_CODE.HEBREW ||
    writingSystem === WRITING_SYSTEM_CODE.GREEK ||
    writingSystem === WRITING_SYSTEM_CODE.CYRILLIC
  );
}

export const preloadActiveFont = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang(), 'preload');
};

export const watchScriptAndLoadFont = (): void => {
  if (
    typeof window === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  const htmlEl = document.documentElement;
  loadFontForLang(getCurrentLang(), 'dynamic');

  const observer = new MutationObserver(() => {
    loadFontForLang(getCurrentLang(), 'dynamic');
  });

  observer.observe(htmlEl, {
    attributes: true,
    attributeFilter: ['lang', 'data-script'],
  });
};

export const setupFontStackCSS = (): void => {
  if (typeof document === 'undefined') return;

  const lang = getCurrentLang();
  if (!lang) return;

  const locale = findLocale(lang);
  const ns = locale?.nativeNumberingSystem;
  const nsConfig = ns ? getNumberingSystemConfig(ns) : undefined;

  const primaryFont = nsConfig?.fontFamily ?? FONT_STACK.primary.family;
  document.documentElement.style.setProperty('--font-primary', primaryFont);
};

export const loadLanguageFonts = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang(), 'dynamic');
};

export const loadFallbackFonts = (): void => {
  if (typeof document === 'undefined') return;

  const lang = getCurrentLang();
  if (!lang) return;

  const locale = findLocale(lang);
  const ns = locale?.nativeNumberingSystem;
  const nsConfig = ns ? getNumberingSystemConfig(ns) : undefined;
  const writingSystem = nsConfig?.writingSystem as WritingSystemCode | undefined;

  if (!writingSystem || isLatinBased(writingSystem)) return;

  const weights = FONT_STACK.primary.variants.default;
  const fontName = FONT_STACK.primary.name;

  void Promise.all(
    weights.map((weight) => import(`@fontsource/${fontName}/${weight}.css`)),
  ).catch((err: unknown) => handleLoadError('fallback fonts', err));
};
