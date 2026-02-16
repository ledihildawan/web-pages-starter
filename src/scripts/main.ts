import "@fontsource/inter";
import "@fontsource/inter/500";
import "@fontsource/inter/700";
import "@fontsource/inter/900";

import Alpine from 'alpinejs'

import { initI18n } from './i18n';

import "./stores/i18n"

window.Alpine = Alpine;

Alpine.store('tabs', {
  current: 'first',
  items: ['first', 'second', 'third'],
})

Alpine.start()

async function bootstrap() {
  // Inisialisasi i18n lebih dulu
  await initI18n();

  // Logika aplikasi lainnya setelah i18n siap
  console.log('App ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}