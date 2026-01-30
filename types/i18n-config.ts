export type Locale = 'en' | 'id' | 'fr';

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  cookieName: string;
  cookieDuration: number;
}

export interface TranslationSchema {
  [key: string]: string | TranslationSchema;
}

export interface LocalizedPathOptions {
  locale?: Locale;
  path?: string;
}

export interface LanguageSwitcher {
  [locale: string]: string;
}
