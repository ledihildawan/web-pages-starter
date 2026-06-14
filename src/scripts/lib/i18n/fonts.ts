import '@fontsource-variable/inter/index.css';

import {
  ACTIVE_NOTO_SANS,
  ACTIVE_WRITING_SYSTEMS,
} from '../../../../generated/active-locales-data';
import { i18nConfig } from '../../../configs/i18n';
import { getActiveLocales } from './active-locales';
import type { LocaleConfig } from './data';
import type { NumberingSystemCode } from './numbering-systems';
import type { WritingSystemCode } from './writing-systems';

type FontLoader = () => Promise<unknown>;

const SCRIPT_FONT_LOADERS: Partial<Record<string, FontLoader>> =
  Object.fromEntries(
    Object.entries(ACTIVE_NOTO_SANS).map(([ns, { loader }]) => [ns, loader]),
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
  const wsConfig = ACTIVE_WRITING_SYSTEMS.find(
    (ws) => ws.code === writingSystem,
  );

  const primaryFont = wsConfig?.defaultFont ?? i18nConfig.fonts.primary.family;
  document.documentElement.style.setProperty('--font-primary', primaryFont);
};

export const loadLanguageFonts = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang());
};
