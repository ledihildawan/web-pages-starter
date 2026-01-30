import Alpine from 'alpinejs';
import { initI18n, t, getCurrentLocale } from '../utils/i18n';
import { i18nPlugin } from '../utils/i18n-alpine';

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

const initApp = async (): Promise<void> => {
  window.Alpine = Alpine;

  // Initialize i18n with auto-detection
  await initI18n();

  // Register i18n Alpine plugin
  Alpine.plugin(i18nPlugin);

  Alpine.data('app', () => {
    return {
      theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),

      init() {
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },

      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },

      isDark() {
        return this.theme === 'dark';
      }
    };
  });

  Alpine.start();

  console.log('✅ App initialized');
  console.log('🌐 Current locale:', getCurrentLocale());
};

initApp().catch(error => {
  console.error('❌ Failed to start app:', error);
});
