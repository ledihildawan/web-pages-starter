import './styles/main.css';

import { env } from '@config/env';

const SINGLE_LOCALE = Boolean(import.meta.env.SINGLE_LOCALE);

const showUpdateNotification = (registration: ServiceWorkerRegistration): void => {
  if (!globalThis.Alpine) return;

  const currentStore = globalThis.Alpine.store('app') as Record<string, unknown> | undefined;
  globalThis.Alpine.store('app', {
    ...(currentStore ?? {}),
    swUpdateAvailable: true,
  });

  const banner = document.createElement('div');
  banner.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm';
  banner.innerHTML = `
    <div class="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-2">Update Available</h3>
      <p class="text-slate-300 mb-6">A new version of this app is ready. Reload to update.</p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-100 transition-colors" id="sw-reload-btn">
          Reload
        </button>
        <button class="flex-1 px-4 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors" id="sw-dismiss-btn">
          Later
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  banner.querySelector('#sw-reload-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  banner.querySelector('#sw-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
  });
};

const registerServiceWorker = (): void => {
  if (!env.IS_PROD || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register(`${env.BASE_PATH}sw.js`).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Service worker registration failed —', message);
  });

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) {
      showUpdateNotification(reg);
      return;
    }

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateNotification(reg);
        }
      });
    });
  });
};

async function bootstrap() {
  try {
    const [Alpine, Collapse, Focus, fonts] = await Promise.all([
      import('alpinejs').then((m) => m.default),
      import('@alpinejs/collapse').then((m) => m.default),
      import('@alpinejs/focus').then((m) => m.default),
      import('@i18n/fonts/fonts'),
    ]);

    fonts.setupFontStackCSS();

    globalThis.Alpine = Alpine;
    Alpine.plugin(Collapse);
    Alpine.plugin(Focus);

    if (SINGLE_LOCALE) {
      Alpine.store('i18n', {
        current: window.__SERVER_LOCALE__ ?? 'en-US',
        languages: [],
        change: () => {},
      });
    } else {
      const [{ registerI18nStore }] = await Promise.all([import('@i18n/runtime/store')]);
      registerI18nStore();

      const { i18next, initIntl } = await import('@i18n/runtime/runtime');
      if (!i18next.isInitialized) {
        const locale = window.__SAVED_LOCALE__ || window.__SERVER_LOCALE__;
        await initIntl(locale);
      }
    }

    requestAnimationFrame(() => Alpine.start());

    fonts.preloadActiveFont();
    fonts.loadLanguageFonts();
    fonts.watchScriptAndLoadFont();

    registerServiceWorker();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Warning: Bootstrap failed —', message);
  }
}

void bootstrap();
