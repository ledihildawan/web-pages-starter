import type { LocaleCode } from '@i18n/data/locales';
import type { DateTimePreset } from '@utils/types';

export type I18nConfig<T extends LocaleCode = LocaleCode> = {
  locales: LocaleCode[];
  defaultLocale: T;
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

export type { RegionalPrice } from '@generated/pricing';

export interface TemplateFormatOptions extends FormatOptions {
  raw?: boolean;
  className?: string;
}
