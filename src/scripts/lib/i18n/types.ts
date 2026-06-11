import type { DateTimePreset } from '../../utils/types';
import type { LocaleCode } from './data';

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

export type I18nConfig = {
  defaultLocale: LocaleCode;
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
