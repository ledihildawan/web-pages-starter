import type { DateTimePreset } from '../../../src/core/utils/types';
import type { LocaleCode } from '../data/locales';

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type FontConfig = {
  name: string;
  family: string;
  weights?: readonly FontWeight[];
};

export type FontStack = {
  primary: FontConfig;
  secondary?: FontConfig;
  monospace?: FontConfig;
};

export type I18nConfig<T extends LocaleCode = LocaleCode> = {
  defaultLocale: T;
  locales?: Exclude<LocaleCode, T>[];
  fonts: FontStack;
};

export interface I18nItem {
  v: string;
  k: string;
  vars: string | null;
}

export interface TemplateParams {
  entryName?: string;
  [key: string]: unknown;
}

export interface FormatOptions extends Intl.NumberFormatOptions {
  nativeDigits?: boolean;
}

export interface CardinalOptions {
  style?: 'full' | 'short';
  gender?: 'masculine' | 'feminine';
}

export interface OrdinalOptions {
  suffixStyle?: 'auto' | 'explicit';
}

export interface DurationOptions extends Intl.RelativeTimeFormatOptions {
  numeric?: 'always' | 'auto';
}

export interface ListFormatOptions extends Intl.ListFormatOptions {
  style?: 'long' | 'short' | 'narrow';
  type?: 'conjunction' | 'disjunction' | 'unit';
}

export interface TimeFormatOptions {
  timeStyle?: DateTimePreset;
}

export interface RelativeTimeOptions {
  unit: Intl.RelativeTimeFormatUnit;
  numeric?: 'always' | 'auto';
}

export interface RegionalPrice {
  pricing: {
    base: number;
    [locale: string]: number;
  };
}
