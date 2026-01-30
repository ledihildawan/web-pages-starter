import { Alpine } from 'alpinejs';
import {
  getCurrentLocale,
  switchLocale,
  getLocalizedPath,
  createLanguageSwitcher,
  getAvailableLocales,
} from '../utils/i18n';

declare global {
  interface Window {
    Alpine: Alpine;
  }
}

export function i18nPlugin(Alpine: Alpine): void {
  Alpine.data('i18n', () => {
    return {
      currentLocale: getCurrentLocale(),
      availableLocales: getAvailableLocales(),

      get languageSwitcher() {
        return createLanguageSwitcher(this.currentLocale);
      },

      get flagEmoji(): string {
        const flags: Record<string, string> = {
          en: '🇬🇧',
          id: '🇮🇩',
          fr: '🇫🇷',
        };

        return flags[this.currentLocale] || '🌐';
      },

      changeLocale(locale: string): void {
        switchLocale(locale as any);
      },

      getLocalizedLink(path: string, locale?: string): string {
        return getLocalizedPath(locale as any, path);
      },
    };
  });

  Alpine.directive('localized', (el: HTMLElement, { expression }, { effect, evaluateLater }) => {
    const getExpression = evaluateLater(expression);

    effect(() => {
      getExpression((value: any) => {
        if (typeof value === 'string') {
          el.setAttribute('href', getLocalizedPath(getCurrentLocale(), value));
        }
      });
    });
  });
}
