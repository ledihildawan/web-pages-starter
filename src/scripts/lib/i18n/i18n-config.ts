import type { FontConfig, FontStack, I18nConfig } from './types';

const validateFont = (font: FontConfig): void => {
  if (!font.name || !/^[\w-]+$/.test(font.name)) {
    throw new Error(
      `[i18n] font.name must be a valid @fontsource package name (e.g., "inter", "roboto")`,
    );
  }
  if (!font.family.trim()) {
    throw new Error(`[i18n] font.family is required`);
  }
};

export const defineFont = (config: FontConfig): FontConfig => {
  validateFont(config);
  return config;
};

export const defineStack = (stack: FontStack): FontStack => {
  validateFont(stack.primary);
  if (stack.secondary) validateFont(stack.secondary);
  if (stack.monospace) validateFont(stack.monospace);
  return stack;
};

export const defineI18n = (config: I18nConfig): I18nConfig => {
  if (!config.defaultLocale) {
    throw new Error('[i18n] defaultLocale is required');
  }
  if (!config.fonts) {
    throw new Error('[i18n] fonts is required');
  }
  validateFont(config.fonts.primary);
  if (config.fonts.secondary) validateFont(config.fonts.secondary);
  if (config.fonts.monospace) validateFont(config.fonts.monospace);
  return config;
};
