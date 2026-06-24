import { fontsConfig } from '@config/fonts';
import { ASSET_PATHS } from '@web-pages-starter/core/asset-paths';
import { ACTIVE_WRITING_SYSTEMS } from '@generated/active-locales-data';
import type { LocaleConfig } from '@i18n/data/locales';
import type { WritingSystemCode } from '@i18n/data/writing-systems';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { getCspNonce } from '@utils/common';

const loaded = new Set<string>();

function getCurrentLang(): string | null {
  return document.documentElement.getAttribute('lang');
}

function findLocale(lang: string): LocaleConfig | undefined {
  return getActiveLocales().find((l) => l.code === lang || lang.startsWith(`${l.code}-`));
}

function handleLoadError(context: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[fonts] ${context}:`, message);
}

function hasFontFaceRules(): boolean {
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) return true;
      }
    } catch {
      // cross-origin stylesheet
    }
  }
  return false;
}

async function injectFontFaceRules(wsCode: string): Promise<void> {
  if (loaded.has(wsCode)) return;
  loaded.add(wsCode);

  if (document.querySelector(`link[href*="${ASSET_PATHS.fontsCss}"]`) || hasFontFaceRules()) return;

  try {
    const basePath = (window as { __BASE_PATH__?: string }).__BASE_PATH__ ?? '';
    const href = `${basePath}${ASSET_PATHS.fontsCss}`;
    const nonce = getCspNonce();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (nonce) link.setAttribute('nonce', nonce);
    document.head.appendChild(link);
  } catch (err) {
    handleLoadError(`failed to load font for "${wsCode}"`, err);
  }
}

function loadFontForLang(lang: string | null): void {
  if (!lang) return;
  const locale = findLocale(lang);
  const ws = locale?.writingSystem as WritingSystemCode | undefined;
  if (ws) {
    injectFontFaceRules(ws);
  }
}

export const preloadActiveFont = (): void => {
  if (typeof document === 'undefined') return;

  loadFontForLang(getCurrentLang());
};

let fontObserver: MutationObserver | null = null;

export const watchScriptAndLoadFont = (): void => {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
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

  const cssLines: string[] = [':root {'];

  for (const [key, font] of Object.entries(fontsConfig)) {
    if (font) {
      cssLines.push(`  --font-${key}: ${font.family};`);
    }
  }

  const lang = getCurrentLang();
  if (lang) {
    const locale = findLocale(lang);
    const writingSystem = locale?.writingSystem as WritingSystemCode | undefined;
    const wsConfig = ACTIVE_WRITING_SYSTEMS.find((ws) => ws.code === writingSystem);
    if (wsConfig?.defaultFont) {
      cssLines.push(`  --font-sans: ${wsConfig.defaultFont};`);
    }
  }

  cssLines.push('}');

  const nonce = getCspNonce();
  const style = document.createElement('style');
  if (nonce) {
    style.setAttribute('nonce', nonce);
  }
  style.textContent = cssLines.join('\n');
  document.head.appendChild(style);
};

export const loadLanguageFonts = (): void => {
  if (typeof document === 'undefined') return;
  loadFontForLang(getCurrentLang());
};

export const disconnectFontObserver = (): void => {
  if (fontObserver) {
    fontObserver.disconnect();
    fontObserver = null;
  }
};
