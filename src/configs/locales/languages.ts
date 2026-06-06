export const LANGUAGES = [
  {
    code: 'id',
    name: 'Indonesian',
    nameId: 'Indonesia',
    nativeName: 'Bahasa Indonesia',
    family: 'Austronesian',
    defaultScript: 'Latn',
  },
  {
    code: 'en',
    name: 'English',
    nameId: 'Inggris',
    nativeName: 'English',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nameId: 'Jepang',
    nativeName: '日本語',
    family: 'Japonic',
    defaultScript: 'Jpan',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nameId: 'Tiongkok',
    nativeName: '中文',
    family: 'Sinitic',
    defaultScript: 'Hans',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nameId: 'Arab',
    nativeName: 'العربية',
    family: 'Semitic',
    defaultScript: 'Arab',
  },
  {
    code: 'es',
    name: 'Spanish',
    nameId: 'Spanyol',
    nativeName: 'Español',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nameId: 'Portugis',
    nativeName: 'Português',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nameId: 'Hindi',
    nativeName: 'हिन्दी',
    family: 'Indo-Aryan',
    defaultScript: 'Deva',
  },
  {
    code: 'ko',
    name: 'Korean',
    nameId: 'Korea',
    nativeName: '한국어',
    family: 'Koreanic',
    defaultScript: 'Hang',
  },
  {
    code: 'fr',
    name: 'French',
    nameId: 'Perancis',
    nativeName: 'Français',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'de',
    name: 'German',
    nameId: 'Jerman',
    nativeName: 'Deutsch',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'ru',
    name: 'Russian',
    nameId: 'Rusia',
    nativeName: 'Русский',
    family: 'Slavic',
    defaultScript: 'Cyrl',
  },
  {
    code: 'th',
    name: 'Thai',
    nameId: 'Thailand',
    nativeName: 'ภาษาไทย',
    family: 'Kra-Dai',
    defaultScript: 'Thai',
  },
] as const;

export const SCRIPTS = [
  { code: 'Hans', name: 'Simplified Han', nameId: 'Han Sederhana' },
  { code: 'Hant', name: 'Traditional Han', nameId: 'Han Tradisional' },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as LanguageCode[];
export const SCRIPT_CODES = SCRIPTS.map((s) => s.code) as ScriptCode[];

export const LANGUAGE_CODE = LANGUAGE_CODES.reduce(
  (acc, language) => {
    const key = language.toUpperCase();
    return Object.assign(acc, { [key]: language });
  },
  {} as Record<string, LanguageCode>,
) as {
  [K in LanguageCode as Uppercase<K>]: K;
};

export const SCRIPT_CODE = SCRIPT_CODES.reduce(
  (acc, script) => {
    const key = script.toUpperCase();
    return Object.assign(acc, { [key]: script });
  },
  {} as Record<string, ScriptCode>,
) as {
  [K in ScriptCode as Uppercase<K>]: K;
};

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type LanguageConfig = (typeof LANGUAGES)[number];
export type ScriptCode = (typeof SCRIPTS)[number]['code'];
export type ScriptConfig = (typeof SCRIPTS)[number];
