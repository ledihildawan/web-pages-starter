import Alpine from 'alpinejs';
import { initI18n } from '../config/i18n';
import { parseUrl } from '../config/router';
import i18next from 'i18next';

declare global {
  interface Window {
    Alpine: typeof Alpine;
    changeLanguage?: (lang: string) => Promise<void>;
  }
}



const changeLanguage = async (newLang: string): Promise<void> => {
  const { path } = parseUrl(window.location.pathname);
  const newPath = newLang === 'id' ? path : `/${newLang}${path}`;
  window.location.href = newPath.replace(/\/$/, '') || '/';
};

const initApp = async (): Promise<void> => {
  window.Alpine = Alpine;
  
  const { lang } = parseUrl(window.location.pathname);
  const savedLang = localStorage.getItem('language') || 'id';
  
  if (lang && (lang === 'id' || lang === 'en')) {
    localStorage.setItem('language', lang);
  }
  
  window.changeLanguage = changeLanguage;
  
  await initI18n(lang || savedLang);
  
  Alpine.data('app', () => {
    return {
      language: lang || savedLang,
      theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      
      init() {
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },
      
      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },
      
      async toggleLanguage() {
        const newLang = this.language === 'id' ? 'en' : 'id';
        this.language = newLang;
        localStorage.setItem('language', newLang);
        await window.changeLanguage!(newLang);
      },
      
      isDark() {
        return this.theme === 'dark';
      }
    };
  });
  
  Alpine.start();
  
  console.log('✅ App initialized');
};

initApp().catch(error => {
  console.error('❌ Failed to start app:', error);
});
