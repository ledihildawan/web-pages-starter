import type { DateTimePreset } from '../../core/utils/types';
import type { LocaleCode } from '../data/locales';

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type FontConfig = {
  name: string;
  family: string;
  weights?: readonly FontWeight[];
};

export type FontStack = {
  sans: FontConfig;
  serif?: FontConfig;
  mono?: FontConfig;
  [key: string]: FontConfig | undefined;
};

export type I18nConfig<T extends LocaleCode = LocaleCode> = {
  defaultLocale: T;
  locales?: Exclude<LocaleCode, T>[];
};

export interface I18nItem {
  value: string;
  key: string;
  vars: string | null;
}

export interface RouteData {
  slug: string;
  data: Record<string, unknown>;
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

export interface TemplateFormatOptions extends FormatOptions {
  raw?: boolean;
  className?: string;
}
