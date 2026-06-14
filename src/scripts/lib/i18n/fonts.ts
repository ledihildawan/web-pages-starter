import '@fontsource-variable/inter/index.css';

import { i18nConfig } from '../../../configs/i18n';
import { getActiveLocales } from './active-locales';
import type { LocaleConfig } from './data';
import type { NumberingSystemCode } from './numbering-systems';
import { WRITING_SYSTEMS, type WritingSystemCode } from './writing-systems';

type FontLoader = () => Promise<unknown>;

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
    css: '@fontsource-variable/noto-sans-devanagari/index.css',
    loader: () => import('@fontsource-variable/noto-sans-devanagari/index.css'),
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
  tamldec: {
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
  hebr: {
    css: '@fontsource-variable/noto-sans-hebrew/index.css',
    loader: () => import('@fontsource-variable/noto-sans-hebrew/index.css'),
  },
  orya: {
    css: '@fontsource/noto-sans-oriya/400.css',
    loader: () => import('@fontsource/noto-sans-oriya/400.css'),
  },
  tibt: {
    css: '@fontsource-variable/noto-serif-tibetan/index.css',
    loader: () => import('@fontsource-variable/noto-serif-tibetan/index.css'),
  },
  nkoo: {
    css: '@fontsource/noto-sans-nko/400.css',
    loader: () => import('@fontsource/noto-sans-nko/400.css'),
  },
  adlm: {
    css: '@fontsource-variable/noto-sans-adlam/index.css',
    loader: () => import('@fontsource-variable/noto-sans-adlam/index.css'),
  },
};

const SCRIPT_FONT_LOADERS: Partial<Record<NumberingSystemCode, FontLoader>> =
  Object.fromEntries(
    Object.entries(NOTO_SANS).map(([ns, { loader }]) => [
      ns as NumberingSystemCode,
      loader,
    ]),
  );

const loaded = new Set<NumberingSystemCode>();

function getCurrentLang(): string | null {
  return document.documentElement.getAttribute('lang');
}

function findLocale(lang: string): LocaleConfig | undefined {
  return getActiveLocales().find(
    (l) => l.code === lang || lang.startsWith(`${l.code}-`),
  );
}

function handleLoadError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fonts] ${context}:`, message);
}

function loadFontForLang(lang: string | null): void {
  if (!lang) return;

  const locale = findLocale(lang);
  const ns = locale?.nativeNumberingSystem;
  if (!ns) return;

  const loader = SCRIPT_FONT_LOADERS[ns];
  if (!loader || loaded.has(ns)) return;
  loaded.add(ns);
  loader().catch((err: unknown) =>
    handleLoadError(`load failed for "${ns}"`, err),
  );
}

export const preloadActiveFont = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang());
};

let fontObserver: MutationObserver | null = null;

export const watchScriptAndLoadFont = (): void => {
  if (
    typeof window === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  if (fontObserver) return;

  const htmlEl = document.documentElement;
  loadFontForLang(getCurrentLang());

  fontObserver = new MutationObserver(() => {
    loadFontForLang(getCurrentLang());
  });

  fontObserver.observe(htmlEl, {
    attributes: true,
    attributeFilter: ['lang', 'data-script'],
  });
};

export const setupFontStackCSS = (): void => {
  if (typeof document === 'undefined') return;

  const lang = getCurrentLang();
  if (!lang) return;

  const locale = findLocale(lang);
  const writingSystem = locale?.writingSystem as WritingSystemCode | undefined;
  const wsConfig = WRITING_SYSTEMS.find((ws) => ws.code === writingSystem);

  const primaryFont = wsConfig?.defaultFont ?? i18nConfig.fonts.primary.family;
  document.documentElement.style.setProperty('--font-primary', primaryFont);
};

export const loadLanguageFonts = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang());
};
