import { LOCALES } from '@/configs/locales/data';
import type { NumberingSystemCode } from '@/configs/locales/numbering-systems';

const PRELOAD_FONTS: Partial<Record<NumberingSystemCode, string>> = {
  jpan: '@fontsource-variable/noto-sans-jp/index.css',
  hans: '@fontsource-variable/noto-sans-sc/index.css',
  hant: '@fontsource-variable/noto-sans-tc/index.css',
  kore: '@fontsource-variable/noto-sans-kr/index.css',
  arab: '@fontsource-variable/noto-sans-arabic/index.css',
  deva: '@fontsource/noto-sans-devanagari/400.css',
  thai: '@fontsource-variable/noto-sans-thai/index.css',
};

const preloaded = new Set<string>();

export const preloadActiveFont = (): void => {
  if (typeof document === 'undefined') return;

  const lang = document.documentElement.getAttribute('lang');
  if (!lang) return;

  const locale = LOCALES.find(
    (l) => l.code === lang || lang.startsWith(`${l.code}-`),
  );
  const ns = locale?.nativeNumberingSystem as NumberingSystemCode | undefined;
  if (!ns) return;
  const css = PRELOAD_FONTS[ns];
  if (!css || preloaded.has(css)) return;

  preloaded.add(css);

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = css;
  document.head.appendChild(link);
};
