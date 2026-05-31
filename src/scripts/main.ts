import '@fontsource-variable/noto-sans/index.css';
import '@fontsource-variable/noto-sans-jp/index.css';
import '@fontsource-variable/noto-sans-sc/index.css';
import '@fontsource-variable/noto-sans-arabic/index.css';
import '@fontsource-variable/noto-sans-kr/index.css';
import '@fontsource/inter/400.css';
import Alpine from 'alpinejs';
import { initI18n } from './libs/i18n';
import { registerI18nStore } from './stores/i18n';

window.Alpine = Alpine;

const isSlowConnection = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    return connection.saveData || (connection.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType));
  }
  return false;
};

const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

const deferNonCritical = () => {
  const isSlow = isSlowConnection();

  if (isDesktop && !isSlow) {
    Promise.all([
      import('@fontsource/inter/700.css'),
      import('@fontsource/inter/900.css')
    ]);
    import('@alpinejs/collapse').then(module => Alpine.plugin(module.default));
    import('@alpinejs/focus').then(module => Alpine.plugin(module.default));
  } else if (isSlow) {
    requestIdleCallback(() => {
      import('@fontsource/inter/700.css');
    }, { timeout: 2_000 });
  } else {
    requestIdleCallback(() => {
      import('@fontsource/inter/700.css');
      import('@fontsource/inter/900.css');
    });
    requestIdleCallback(() => {
      import('@alpinejs/collapse').then(module => Alpine.plugin(module.default));
    });
    requestIdleCallback(() => {
      import('@alpinejs/focus').then(module => Alpine.plugin(module.default));
    });
  }
};

async function bootstrap() {
  try {
    await initI18n();
    registerI18nStore();
  } catch (error) {
    console.error('Bootstrap failed:', error);
  } finally {
    if (isDesktop) {
      document.documentElement.classList.add('is-desktop');
    } else {
      document.documentElement.classList.add('is-mobile');
    }
    if (isSlowConnection()) {
      document.documentElement.classList.add('slow-connection');
    }
    Alpine.start();
    deferNonCritical();
  }
}

const scheduleBootstrap = () => {
  const isSlow = isSlowConnection();

  if (isSlow) {
    requestIdleCallback(() => bootstrap(), { timeout: 2_000 });
  } else if ('requestIdleCallback' in window) {
    requestIdleCallback(() => bootstrap());
  } else {
    requestAnimationFrame(() => setTimeout(bootstrap, 0));
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleBootstrap);
} else {
  scheduleBootstrap();
}
