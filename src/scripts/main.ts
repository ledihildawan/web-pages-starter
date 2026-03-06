import "@fontsource/inter";
import "@fontsource/inter/500";
import "@fontsource/inter/700";
import "@fontsource/inter/900";

import Alpine from 'alpinejs';
import { initI18n } from './i18n';
import { registerI18nStore } from './stores/i18n';

window.Alpine = Alpine;

async function bootstrap() {
  try {
    await initI18n();

    registerI18nStore();
  } catch (error) {
    console.error('💥 Bootstrap failed:', error);
  } finally {
    Alpine.start();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
