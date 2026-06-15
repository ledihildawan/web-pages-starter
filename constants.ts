export const IS_NODE = typeof window === 'undefined';

export const IS_PROD = process.env.NODE_ENV === 'production';

export const ROOT = IS_NODE ? process.cwd() : '';

export const LOCALES = 'locales';

export const GENERATED = 'generated';
