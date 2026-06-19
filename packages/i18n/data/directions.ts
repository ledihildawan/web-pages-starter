export const DIRECTIONS = [
  {
    code: 'ltr',
    label: 'Left to Right',
    description: 'Text and UI elements flow from left to right',
    symbol: '←',
    languages: ['id', 'en', 'ja', 'es', 'pt', 'hi', 'ko', 'fr', 'de', 'ru', 'th'],
  },
  {
    code: 'rtl',
    label: 'Right to Left',
    description: 'Text and UI elements flow from right to left',
    symbol: '→',
    languages: ['ar'],
  },
] as const;

export const DIRECTION_CODES = DIRECTIONS.map((d) => d.code) as DirectionCode[];

export const DIRECTION_CODE = Object.fromEntries(DIRECTION_CODES.map((dir) => [dir.toUpperCase(), dir] as const)) as {
  [K in DirectionCode as Uppercase<K>]: K;
};

export type DirectionCode = (typeof DIRECTIONS)[number]['code'];
export type DirectionConfig = (typeof DIRECTIONS)[number];
