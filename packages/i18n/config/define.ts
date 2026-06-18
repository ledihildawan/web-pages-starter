import type { LocaleCode } from '@i18n/data/locales';
import type { FontConfig, FontStack, I18nConfig } from './types';

const validateFont = (font: FontConfig): void => {
  if (!font.name || !/^[\w-]+$/.test(font.name)) {
    throw new Error(`[i18n] font.name must be a valid identifier (letters, digits, hyphens only)`);
  }
  if (!font.family.trim()) {
    throw new Error('[i18n] font.family is required');
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
  return config;
};
