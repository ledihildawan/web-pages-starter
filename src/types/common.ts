import type { LANGUAGES } from "@/configs/locales";

export type DateValue = string | number | Date;

export type DateTimePreset = 'short' | 'medium' | 'long' | 'full';

export type SupportedLanguage = (typeof LANGUAGES)[number]['code'];