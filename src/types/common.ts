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

/**
 * Page meta configuration (from pages/*/index.json5)
 */
export interface PageMetaConfig {
  title?: string;
  description?: string;
  image?: string;
  image_alt?: string;
  canonical?: string;
  no_index?: boolean;
  theme_color?: string;
  og_type?: string;
}

/**
 * Page data structure from index.json5
 */
export interface PageData {
  page_id: string;
  meta?: PageMetaConfig;
  [key: string]: JsonValue;
}

/**
 * Global SEO configuration (from data/global.json5)
 */
export interface GlobalSeoConfig {
  theme_color?: string;
  og_type?: string;
  twitter_card?: string;
  manifest_path?: string;
  favicon_path?: string;
  apple_touch_icon_path?: string;
}

/**
 * Global data structure
 */
export interface GlobalData {
  site_name?: string;
  site_description?: string;
  site_url?: string;
  site_image?: string;
  seo?: GlobalSeoConfig;
  [key: string]: JsonValue;
}