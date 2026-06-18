import '@/styles/main.css';

import { env } from '@generated/env';

const SW_DISMISS_KEY = 'sw_update_dismissed';
const SW_DISMISS_DURATION = 24 * 60 * 60 * 1000;

const showBootstrapError = (_message: string) => {
  const style = document.createElement('style');
  style.id = 'bootstrap-error-style';
  style.textContent = `
    #bootstrap-error { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #020617; color: #e2e8f0; font-family: system-ui, sans-serif; padding: 2rem; }
    #bootstrap-error .inner { text-align: center; max-width: 400px; }
    #bootstrap-error h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #f87171; }
    #bootstrap-error p { color: #94a3b8; margin-bottom: 1.5rem; }
    #bootstrap-error button { background: #7c3aed; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; border: none; }
  `;
  document.head.appendChild(style);

  const errorDiv = document.createElement('div');
  errorDiv.id = 'bootstrap-error';
  errorDiv.innerHTML = `
    <div class="inner">
      <h1>Initialization Error</h1>
      <p>The application failed to load properly. Please refresh the page or try again later.</p>
      <button id="bootstrap-reload-btn">Refresh Page</button>
    </div>
  `;
  document.body.appendChild(errorDiv);

  document.getElementById('bootstrap-reload-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
};

const isUpdateRecentlyDismissed = (): boolean => {
  try {
    const dismissed = localStorage.getItem(SW_DISMISS_KEY);

    if (!dismissed) return false;

    const timestamp = parseInt(dismissed, 10);

    if (Number.isNaN(timestamp)) return false;

    return Date.now() - timestamp < SW_DISMISS_DURATION;
  } catch {
    return false;
  }
};

const dismissUpdate = () => {
  try {
    localStorage.setItem(SW_DISMISS_KEY, String(Date.now()));
  } catch {}
};

const showUpdateNotification = (registration: ServiceWorkerRegistration) => {
  if (!globalThis.Alpine) return;

  if (isUpdateRecentlyDismissed()) return;

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
    dismissUpdate();

    banner.remove();
  });
};

const registerServiceWorker = () => {
  if (!env.IS_PROD || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register(`${env.BASE_PATH}service-worker.js`).catch((error: unknown) => {
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
    const [cspModule, plugins, fonts] = await Promise.all([
      import('@alpinejs/csp').then((m) => m.default),
      Promise.all([
        import('@alpinejs/collapse').then((m) => m.default),
        import('@alpinejs/focus').then((m) => m.default),
      ]),
      import('@i18n/fonts/fonts'),
    ]);

    Alpine = cspModule;

    for (const plugin of plugins) {
      Alpine.plugin(plugin);
    }

    const states = await Promise.all([import('../shared/nav/navbar')]);

    for (const state of states) {
      Alpine[state.type](state.name, state.value);
    }

    if (!import.meta.env.SINGLE_LOCALE) {
      const i18nStore = await import('@i18n/runtime/store');

      Alpine.store(i18nStore.name, i18nStore.value);

      const { i18next, initIntl } = await import('@i18n/runtime/runtime');

      if (!i18next.isInitialized) {
        await initIntl(window.__SAVED_LOCALE__ || window.__SERVER_LOCALE__);
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

    showBootstrapError(message);
  }
}

bootstrap();
