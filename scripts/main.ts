import Alpine from 'alpinejs';
import { initI18n } from '../config/i18n';
import homeController from '../features/home/home';

import '@/styles/main.css';

declare global {
  interface Window {
    Alpine: typeof Alpine;
  }
}

window.Alpine = Alpine;

const startApp = async (): Promise<void> => {
  try {
    await initI18n();
    Alpine.data('homeController', homeController);
    Alpine.start();
    console.log('✅ i18n & Alpine initialized');
  } catch (error) {
    console.error('❌ Failed to start app:', error);
  }
};

startApp();