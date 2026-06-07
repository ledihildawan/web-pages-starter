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
  {
    code: 'nl',
    name: 'Dutch',
    nameId: 'Belanda',
    nativeName: 'Nederlands',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'ca',
    name: 'Catalan',
    nameId: 'Katalan',
    nativeName: 'Català',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'it',
    name: 'Italian',
    nameId: 'Italia',
    nativeName: 'Italiano',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'no',
    name: 'Norwegian',
    nameId: 'Norwegia',
    nativeName: 'Norsk',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'fi',
    name: 'Finnish',
    nameId: 'Finlandia',
    nativeName: 'Suomi',
    family: 'Uralic',
    defaultScript: 'Latn',
  },
  {
    code: 'sv',
    name: 'Swedish',
    nameId: 'Swedia',
    nativeName: 'Svenska',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'da',
    name: 'Danish',
    nameId: 'Denmark',
    nativeName: 'Dansk',
    family: 'Germanic',
    defaultScript: 'Latn',
  },
  {
    code: 'cs',
    name: 'Czech',
    nameId: 'Ceko',
    nativeName: 'Čeština',
    family: 'Slavic',
    defaultScript: 'Latn',
  },
  {
    code: 'hu',
    name: 'Hungarian',
    nameId: 'Hungaria',
    nativeName: 'Magyar',
    family: 'Uralic',
    defaultScript: 'Latn',
  },
  {
    code: 'ro',
    name: 'Romanian',
    nameId: 'Rumania',
    nativeName: 'Română',
    family: 'Romance',
    defaultScript: 'Latn',
  },
  {
    code: 'pl',
    name: 'Polish',
    nameId: 'Polandia',
    nativeName: 'Polski',
    family: 'Slavic',
    defaultScript: 'Latn',
  },
  {
    code: 'el',
    name: 'Greek',
    nameId: 'Yunani',
    nativeName: 'Ελληνικά',
    family: 'Hellenic',
    defaultScript: 'Grek',
  },
] as const;

export const SCRIPTS = [
  { code: 'Hans', name: 'Simplified Han', nameId: 'Han Sederhana' },
  { code: 'Hant', name: 'Traditional Han', nameId: 'Han Tradisional' },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as LanguageCode[];
export const SCRIPT_CODES = SCRIPTS.map((s) => s.code) as ScriptCode[];

export const LANGUAGE_CODE = Object.fromEntries(
  LANGUAGE_CODES.map((language) => [language.toUpperCase(), language] as const),
) as {
  [K in LanguageCode as Uppercase<K>]: K;
};

export const SCRIPT_CODE = Object.fromEntries(
  SCRIPT_CODES.map((script) => [script.toUpperCase(), script] as const),
) as {
  [K in ScriptCode as Uppercase<K>]: K;
};

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type LanguageConfig = (typeof LANGUAGES)[number];
export type ScriptCode = (typeof SCRIPTS)[number]['code'];
export type ScriptConfig = (typeof SCRIPTS)[number];
