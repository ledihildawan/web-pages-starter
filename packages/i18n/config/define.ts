import type { LocaleCode } from '../data/locales';
import type { I18nConfig } from './types';

export const defineI18n = <T extends LocaleCode>(config: I18nConfig<T>): I18nConfig<T> => {
  return config;
};
