import { DEFAULT_LOCALE, LOCALE } from '@/configs/locales';

import '@fontsource/inter/900.css';

const lang = document.documentElement.lang || DEFAULT_LOCALE;
const isSlowConnection = navigator.connection?.saveData ||
  ['slow-2g', '2g', '3g'].includes(navigator.connection?.effectiveType ?? '');

const loadLanguageFonts = () => {
  const fontMap: Record<string, () => Promise<void>> = {
    [LOCALE.JA_JP]: () => import('@fontsource-variable/noto-sans-jp/index.css'),
    [LOCALE.ZH_CN]: () => import('@fontsource-variable/noto-sans-sc/index.css'),
    [LOCALE.AR_SA]: () => import('@fontsource-variable/noto-sans-arabic/index.css'),
    [LOCALE.KO_KR]: () => import('@fontsource-variable/noto-sans-kr/index.css'),
  };

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

async function bootstrap() {
  try {
    const [{ initIntl }, { registerI18nStore }, { registerNavbarComponent }, AlpineModule, collapse, focus] = await Promise.all([
      import('./lib/i18n'),
      import('./stores/i18n'),
      import('./components/navbar'),
      import('alpinejs'),
      import('@alpinejs/collapse'),
      import('@alpinejs/focus')
    ]);

    await initIntl();

    const Alpine = AlpineModule.default;
    globalThis.Alpine = Alpine;
    Alpine.plugin(collapse.default);
    Alpine.plugin(focus.default);
    registerI18nStore();
    registerNavbarComponent();

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
