import { DEFAULT_LANG } from '@/configs/locales';

// ============================================
// APP BOOTSTRAP
// ============================================

import '@fontsource/inter/900.css';

const lang = document.documentElement.lang || DEFAULT_LANG;
const isSlowConnection = navigator.connection?.saveData ||
  ['slow-2g', '2g', '3g'].includes(navigator.connection?.effectiveType ?? '');

// ============================================
// RESOURCE LOADERS
// ============================================

const loadLanguageFonts = () => {
  const fontMap = {
    'ja-JP': () => import('@fontsource-variable/noto-sans-jp/index.css'),
    'zh-CN': () => import('@fontsource-variable/noto-sans-sc/index.css'),
    'ar-SA': () => import('@fontsource-variable/noto-sans-arabic/index.css'),
    'ko-KR': () => import('@fontsource-variable/noto-sans-kr/index.css'),
  } as Record<string, () => Promise<void>>;

  fontMap[lang]?.();
};

const loadSecondaryFonts = () => {
  if (!isSlowConnection) {
    Promise.all([
      import('@fontsource/inter/400.css'),
      import('@fontsource/inter/700.css')
    ]);
  }
};

// ============================================
// BOOTSTRAP
// ============================================

async function bootstrap() {
  try {
    const [{ initIntl }, { registerIntlStore }, AlpineModule, collapse, focus] = await Promise.all([
      import('./lib/i18n'),
      import('./stores/i18n'),
      import('alpinejs'),
      import('@alpinejs/collapse'),
      import('@alpinejs/focus')
    ]);

    await initIntl();

    const Alpine = AlpineModule.default;
    globalThis.Alpine = Alpine;
    Alpine.plugin(collapse.default);
    Alpine.plugin(focus.default);
    registerIntlStore();

    // ============================================
    // CLEANUP: Remove any leftover body lock styles
    // ============================================
    document.body.classList.remove('no-scroll');
    document.body.style.insetBlockStart = '';
    document.documentElement.style.removeProperty('--scrollbar-width');

    Alpine.start();

    loadLanguageFonts();
    loadSecondaryFonts();
  } catch (error) {
    console.error('Bootstrap failed:', error);
  }
}

// ============================================
// STARTUP
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
