export interface FontPackageEntry {
  pkg: string;
  family: string;
  subsets: 'all' | string[];
}

export const INTER_PACKAGE = '@fontsource-variable/inter';

export const EXTRA_INTER_SUBSETS_FOR_LANGUAGE: Record<string, string[]> = {
  vi: ['vietnamese'],
};

export const FONT_FOR_WRITING_SYSTEM: Record<string, FontPackageEntry[]> = {
  latin: [
    {
      pkg: INTER_PACKAGE,
      family: 'Inter Variable',
      subsets: ['latin', 'latin-ext'],
    },
  ],
  cyrillic: [
    {
      pkg: INTER_PACKAGE,
      family: 'Inter Variable',
      subsets: ['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext'],
    },
  ],
  greek: [
    {
      pkg: INTER_PACKAGE,
      family: 'Inter Variable',
      subsets: ['greek', 'greek-ext', 'latin', 'latin-ext'],
    },
  ],
  cjk: [
    { pkg: '@fontsource-variable/noto-sans-jp', family: 'Noto Sans JP Variable', subsets: 'all' },
    { pkg: '@fontsource-variable/noto-sans-sc', family: 'Noto Sans SC Variable', subsets: 'all' },
    { pkg: '@fontsource-variable/noto-sans-tc', family: 'Noto Sans TC Variable', subsets: 'all' },
    { pkg: '@fontsource-variable/noto-sans-kr', family: 'Noto Sans KR Variable', subsets: 'all' },
  ],
  arabic: [
    {
      pkg: '@fontsource-variable/noto-sans-arabic',
      family: 'Noto Sans Arabic Variable',
      subsets: ['arabic', 'latin', 'latin-ext'],
    },
  ],
  devanagari: [
    {
      pkg: '@fontsource-variable/noto-sans-devanagari',
      family: 'Noto Sans Devanagari Variable',
      subsets: ['devanagari', 'latin', 'latin-ext'],
    },
  ],
  thai: [
    {
      pkg: '@fontsource-variable/noto-sans-thai',
      family: 'Noto Sans Thai Variable',
      subsets: ['thai', 'latin', 'latin-ext'],
    },
  ],
  bengali: [
    {
      pkg: '@fontsource-variable/noto-sans-bengali',
      family: 'Noto Sans Bengali Variable',
      subsets: ['bengali', 'latin', 'latin-ext'],
    },
  ],
  tamil: [
    {
      pkg: '@fontsource-variable/noto-sans-tamil',
      family: 'Noto Sans Tamil Variable',
      subsets: ['tamil', 'latin', 'latin-ext'],
    },
  ],
  telugu: [
    {
      pkg: '@fontsource-variable/noto-sans-telugu',
      family: 'Noto Sans Telugu Variable',
      subsets: ['telugu', 'latin', 'latin-ext'],
    },
  ],
  kannada: [
    {
      pkg: '@fontsource-variable/noto-sans-kannada',
      family: 'Noto Sans Kannada Variable',
      subsets: ['kannada', 'latin', 'latin-ext'],
    },
  ],
  malayalam: [
    {
      pkg: '@fontsource-variable/noto-sans-malayalam',
      family: 'Noto Sans Malayalam Variable',
      subsets: ['malayalam', 'latin', 'latin-ext'],
    },
  ],
  gujarati: [
    {
      pkg: '@fontsource-variable/noto-sans-gujarati',
      family: 'Noto Sans Gujarati Variable',
      subsets: ['gujarati', 'latin', 'latin-ext'],
    },
  ],
  gurmukhi: [
    {
      pkg: '@fontsource-variable/noto-sans-gurmukhi',
      family: 'Noto Sans Gurmukhi Variable',
      subsets: ['gurmukhi', 'latin', 'latin-ext'],
    },
  ],
  sinhala: [
    {
      pkg: '@fontsource-variable/noto-sans-sinhala',
      family: 'Noto Sans Sinhala Variable',
      subsets: ['sinhala', 'latin', 'latin-ext'],
    },
  ],
  khmer: [
    {
      pkg: '@fontsource-variable/noto-sans-khmer',
      family: 'Noto Sans Khmer Variable',
      subsets: ['khmer', 'latin', 'latin-ext'],
    },
  ],
  lao: [
    {
      pkg: '@fontsource-variable/noto-sans-lao',
      family: 'Noto Sans Lao Variable',
      subsets: ['lao', 'latin', 'latin-ext'],
    },
  ],
  myanmar: [
    {
      pkg: '@fontsource-variable/noto-sans-myanmar',
      family: 'Noto Sans Myanmar Variable',
      subsets: ['myanmar', 'latin', 'latin-ext'],
    },
  ],
  georgian: [
    {
      pkg: '@fontsource-variable/noto-sans-georgian',
      family: 'Noto Sans Georgian Variable',
      subsets: ['georgian', 'latin', 'latin-ext'],
    },
  ],
  ethiopic: [
    {
      pkg: '@fontsource-variable/noto-sans-ethiopic',
      family: 'Noto Sans Ethiopic Variable',
      subsets: ['ethiopic', 'latin', 'latin-ext'],
    },
  ],
  armenian: [
    {
      pkg: '@fontsource-variable/noto-sans-armenian',
      family: 'Noto Sans Armenian Variable',
      subsets: ['armenian', 'latin', 'latin-ext'],
    },
  ],
  hebrew: [
    {
      pkg: '@fontsource-variable/noto-sans-hebrew',
      family: 'Noto Sans Hebrew Variable',
      subsets: ['hebrew', 'latin', 'latin-ext'],
    },
  ],
  odia: [{ pkg: '@fontsource/noto-sans-oriya', family: 'Noto Sans Oriya', subsets: 'all' }],
  tibetan: [{ pkg: '@fontsource-variable/noto-serif-tibetan', family: 'Noto Serif Tibetan Variable', subsets: 'all' }],
  nko: [{ pkg: '@fontsource/noto-sans-nko', family: 'Noto Sans NKO', subsets: 'all' }],
  adlam: [{ pkg: '@fontsource-variable/noto-sans-adlam', family: 'Noto Sans Adlam Variable', subsets: 'all' }],
};
