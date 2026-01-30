import i18next from 'i18next';

export default function settingsController() {
  const savedLanguage = localStorage.getItem('language') ?? 'id';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme') ?? (prefersDark ? 'dark' : 'light');

  return {
    language: savedLanguage,
    theme: savedTheme,

    init(): void {
      document.documentElement.classList.toggle('dark', this.theme === 'dark');
    },

    toggleTheme(): void {
      const newTheme = this.theme === 'light' ? 'dark' : 'light';
      this.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      window.dispatchEvent(new CustomEvent('theme-changed'));
    },

    async changeLanguage(lang: string): Promise<void> {
      if (lang === this.language) return;
      this.language = lang;
      await i18next.changeLanguage(lang);
      localStorage.setItem('language', lang);
      window.dispatchEvent(new CustomEvent('language-changed'));
    },

    isDark(): boolean {
      return this.theme === 'dark';
    }
  };
}