import { initI18n } from './i18n';

const bootstrap = async () => {
  // Inisialisasi i18n lebih dulu
  await initI18n();

  // Logika aplikasi lainnya setelah i18n siap
  console.log('App ready');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}