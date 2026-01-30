import Alpine from 'alpinejs';
import { initI18n } from '../config/i18n';
import i18next from 'i18next';

declare global {
  interface Window {
    Alpine: typeof Alpine;
    changeLanguage?: (lang: string) => Promise<void>;
  }
}

const getLanguageFromURL = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang');
};

const changeLanguage = async (lang: string): Promise<void> => {
  await i18next.changeLanguage(lang);
  
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.toString());
  
  const translations = document.querySelectorAll('[data-i18n]');
  translations.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = i18next.t(key);
  });
};

const initApp = async (): Promise<void> => {
  window.Alpine = Alpine;
  
  const langFromURL = getLanguageFromURL();
  const savedLang = localStorage.getItem('language') || 'id';
  
  if (langFromURL && (langFromURL === 'id' || langFromURL === 'en')) {
    localStorage.setItem('language', langFromURL);
  }
  
  window.changeLanguage = changeLanguage;
  
  await initI18n(langFromURL || savedLang);
  
  Alpine.data('app', () => {
    return {
      language: localStorage.getItem('language') || 'id',
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
  
  const translations = document.querySelectorAll('[data-i18n]');
  translations.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = i18next.t(key);
  });
  
  console.log('✅ App initialized');
};

initApp().catch(error => {
  console.error('❌ Failed to start app:', error);
});
