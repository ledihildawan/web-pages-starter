export type I18nLanguage = 'id' | 'en';

export interface TranslationSchema {
  common: {
    language: string;
    dark_mode: string;
    light_mode: string;
  };
  home: {
    welcome: string;
    description: string;
    btn_action: string;
    btn_login: string;
  };
}

export type TranslationKey = DotNotation<TranslationSchema>;

export type DotNotation<T, P extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DotNotation<T[K], `${P}${K}.`>
          : `${P}${K}`
        : never;
    }[keyof T]
  : never;

export type I18nResources = {
  [K in I18nLanguage]: { translation: TranslationSchema };
};

export interface I18nContext {
  t: <K extends TranslationKey>(key: K) => string;
  currentPath: string;
}