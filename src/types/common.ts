export type DateValue = string | number | Date;

export type DateTimePreset = 'short' | 'medium' | 'long' | 'full';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type JsonData = Record<string, JsonValue>;

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