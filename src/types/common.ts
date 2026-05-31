export type DateValue = string | number | Date;

export type DateTimePreset = 'short' | 'medium' | 'long' | 'full';

// Template-related types
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

export interface TemplateContext extends TemplateParams {
  lang: string;
  clientI18nScript: string;
  page_id: string;
  global: JsonData;
  page: JsonData;
  i18n: I18nObject;
}

// Format options interfaces - synced with i18n-format.ts
export interface FormatOptions extends Intl.NumberFormatOptions {
  useNativeNumberingSystem?: boolean;
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

export interface I18nObject {
  (key: string | undefined, vars?: Record<string, unknown>): I18nItem;
  t: (key: string | undefined, vars?: Record<string, unknown>) => string;
  html: (key: string | undefined, vars?: Record<string, unknown>) => string;
  attr: (key: string | undefined, attrName: string, vars?: Record<string, unknown>) => string;
  formatNumber: (value: number | string, options?: FormatOptions) => string;
  formatPercent: (value: number | string, options?: FormatOptions) => string;
  formatBytes: (bytes: number, decimals?: number) => string;
  formatDuration: (seconds: number, options?: DurationOptions) => string;
  formatDate: (date: DateValue, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: DateValue, options?: Intl.DateTimeFormatOptions) => string;
  formatOrdinal: (value: number | string, _options?: OrdinalOptions) => string;
  formatCardinal: (value: number | string, _options?: CardinalOptions) => string;
  formatScientific: (value: number | string, options?: FormatOptions) => string;
  formatAbbreviated: (value: number, options?: FormatOptions) => string;
  formatList: (items: string[], options?: ListFormatOptions) => string;
  formatCurrency: (value: number | string, currency: string, options?: FormatOptions) => string;
  formatUnit: (value: number | string, unit: string, options?: FormatOptions) => string;
  formatTime: (date: DateValue, options?: TimeFormatOptions) => string;
  getPluralSuffix: (count: number, lang?: string) => string;
  convertCurrency: (value: number, targetCurrency?: string, options?: FormatOptions) => string;
  localPrice: (plan: RegionalPrice) => number;
  localPriceCurrency: (plan: RegionalPrice) => string;
  convertLocalPrice: (plan: RegionalPrice, targetCurrency?: string, options?: FormatOptions) => string;
  formatLocalPrice: (plan: RegionalPrice, options?: FormatOptions) => string;
  formatLocalPriceDiscounted: (plan: RegionalPrice, discountMultiplier: number, targetCurrency?: string, options?: FormatOptions) => string;
  pluralize: (word: string, count?: number, inclusive?: boolean) => string;
  singularize: (word: string) => string;
  plural: (key: string | undefined, count: number, vars?: Record<string, unknown>) => I18nItem;
  formatRelativeTime: (value: number, options: RelativeTimeOptions) => string;
  nativeNumbers: (text: string, force?: boolean) => string;
}