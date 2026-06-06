import { LOCALES, type LocaleConfig } from '@/configs/locales/data';
import type { NumberingSystemCode } from '@/configs/locales/numbering-systems';

type FontLoader = () => Promise<unknown>;

const SCRIPT_FONT_LOADERS: Partial<Record<NumberingSystemCode, FontLoader>> = {
  jpan: () => import('@fontsource-variable/noto-sans-jp/index.css'),
  hans: () => import('@fontsource-variable/noto-sans-sc/index.css'),
  hant: () => import('@fontsource-variable/noto-sans-tc/index.css'),
  kore: () => import('@fontsource-variable/noto-sans-kr/index.css'),
  arab: () => import('@fontsource-variable/noto-sans-arabic/index.css'),
  deva: () => import('@fontsource/noto-sans-devanagari/400.css'),
  thai: () => import('@fontsource-variable/noto-sans-thai/index.css'),
  beng: () => import('@fontsource-variable/noto-sans-bengali/index.css'),
  taml: () => import('@fontsource-variable/noto-sans-tamil/index.css'),
  telu: () => import('@fontsource-variable/noto-sans-telugu/index.css'),
  knda: () => import('@fontsource-variable/noto-sans-kannada/index.css'),
  mlym: () => import('@fontsource-variable/noto-sans-malayalam/index.css'),
  gujr: () => import('@fontsource-variable/noto-sans-gujarati/index.css'),
  guru: () => import('@fontsource-variable/noto-sans-gurmukhi/index.css'),
  sinh: () => import('@fontsource-variable/noto-sans-sinhala/index.css'),
  khmr: () => import('@fontsource-variable/noto-sans-khmer/index.css'),
  laoo: () => import('@fontsource-variable/noto-sans-lao/index.css'),
  mymr: () => import('@fontsource-variable/noto-sans-myanmar/index.css'),
  geor: () => import('@fontsource-variable/noto-sans-georgian/index.css'),
  ethi: () => import('@fontsource-variable/noto-sans-ethiopic/index.css'),
  armn: () => import('@fontsource-variable/noto-sans-armenian/index.css'),
};

const loadedNumberingSystems = new Set<NumberingSystemCode>();

const findLocale = (lang: string): LocaleConfig | undefined =>
  LOCALES.find((l) => l.code === lang || lang.startsWith(`${l.code}-`));

const loadFontForLang = (lang: string | null): void => {
  if (!lang) return;

  const locale = findLocale(lang);
  const ns = locale?.nativeNumberingSystem as NumberingSystemCode | undefined;
  if (!ns || loadedNumberingSystems.has(ns)) return;

  const loader = SCRIPT_FONT_LOADERS[ns];
  if (!loader) return;

  loadedNumberingSystems.add(ns);
  loader().catch((err: unknown) => {
    loadedNumberingSystems.delete(ns);
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[fonts] Failed to load font for "${ns}":`, message);
  });
};

export const watchScriptAndLoadFont = (): void => {
  if (
    typeof window === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  const htmlEl = document.documentElement;
  loadFontForLang(htmlEl.getAttribute('lang'));

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'attributes') continue;
      if (m.attributeName === 'lang' || m.attributeName === 'data-script') {
        loadFontForLang(htmlEl.getAttribute('lang'));
      }
    }
  });

  observer.observe(htmlEl, {
    attributes: true,
    attributeFilter: ['lang', 'data-script'],
  });
};
