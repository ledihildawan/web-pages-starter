import { LOCALE_CODES } from '../../../../generated/active-locales-data';
import type { LocaleCode } from './data';
import type { FontConfig, I18nConfig } from './types';

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

export const defineI18n = <T extends LocaleCode>(
  config: I18nConfig<T>,
): I18nConfig<T> => {
  if (!config.defaultLocale) {
    throw new Error('[i18n] defaultLocale is required');
  }
  if (!config.fonts) {
    throw new Error('[i18n] fonts is required');
  }
  validateFont(config.fonts.primary);
  if (config.fonts.secondary) validateFont(config.fonts.secondary);
  if (config.fonts.monospace) validateFont(config.fonts.monospace);
  if (config.locales) {
    for (const locale of config.locales) {
      if (!LOCALE_CODES.includes(locale)) {
        throw new Error(`[i18n] locale "${locale}" is not a valid locale code`);
      }
    }
  }
  return config;
};
