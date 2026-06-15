import { LOCALE_CODES } from '@generated/active-locales-data';
import type { LocaleCode } from '@i18n/data/locales';
import type { FontConfig, FontStack, I18nConfig } from './types';

const validateFont = (font: FontConfig): void => {
  if (!font.name || !/^[\w-]+$/.test(font.name)) {
    throw new Error(`[i18n] font.name must be a valid identifier (letters, digits, hyphens only)`);
  }
  if (!font.family.trim()) {
    throw new Error(`[i18n] font.family is required`);
  }
};

export const defineFont = (config: FontConfig): FontConfig => {
  validateFont(config);
  return config;
};

export const defineFontStack = (stack: FontStack): FontStack => {
  if (!stack.sans) {
    throw new Error('[i18n] fontsConfig.sans is required');
  }
  for (const font of Object.values(stack)) {
    if (font) validateFont(font);
  }
  return stack;
};

export const defineI18n = <T extends LocaleCode>(config: I18nConfig<T>): I18nConfig<T> => {
  if (config.locales) {
    const seen = new Set<string>();
    for (const locale of config.locales) {
      if (seen.has(locale)) {
        throw new Error(`[i18n] duplicate locale "${locale}" in locales array`);
      }
      seen.add(locale);
      if (!LOCALE_CODES.includes(locale)) {
        throw new Error(
          `[i18n] locale "${locale}" is not a valid locale code. See packages/i18n/data/locales.ts for the full list.`,
        );
      }
    }
  }
  return config;
};
