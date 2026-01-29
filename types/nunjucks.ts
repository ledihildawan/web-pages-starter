import type { I18nContext } from './i18n';

export interface NunjucksEnv {
  renderString: (template: string, context: Record<string, unknown>) => string;
  addGlobal: (name: string, value: unknown) => void;
  configure: (paths: string[], options?: NunjucksOptions) => NunjucksEnv;
}

export interface NunjucksOptions {
  noCache?: boolean;
  watch?: boolean;
}

export interface TemplateContext extends I18nContext {
  title: string;
  [key: string]: unknown;
}

export interface RenderOptions {
  rootPath: string;
  route: {
    path: string;
    view: string;
    title: string;
    context?: unknown;
  };
  currentPath: string;
  i18nData?: unknown;
}

export type TranslationFunction = (key: string, options?: Record<string, unknown>) => string;