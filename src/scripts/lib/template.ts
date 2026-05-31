import fs from 'node:fs';
import path from 'node:path';
import type { I18nTranslationKeys } from '../../../generated/i18n';
import { DEFAULT_LANG, LANGUAGES } from '../../configs/locales';
import { PATHS } from '../../configs/paths';
import type {
  I18nItem,
  I18nObject,
  JsonData,
  TemplateContext,
  TemplateParams,
} from '../../types/common';
import { getValueByPath } from '../utils/common';
import {
  convertCurrency,
  convertLocalPrice,
  formatAbbreviated,
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatList,
  formatLocalPrice,
  formatLocalPriceDiscounted,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatRelativeTime,
  formatScientific,
  formatTime,
  formatUnit,
  localPrice,
  localPriceCurrency,
  plural,
  singular,
  toNativeDigits,
} from '../utils/i18n-format';
import { getPluralSuffix, setLanguage } from '../utils/locale';
import {
  loadGlobalData,
  loadSelectedComponentLocales,
  readJSON5,
} from '../utils/server';

const ROOT = process.cwd();
const resolveRoot = (...args: string[]): string => path.resolve(ROOT, ...args);

/**
 * Get all components used in a template by scanning for include/import statements.
 */
export const getUsedComponents = (
  templatePath: string,
  found = new Set<string>(),
): string[] => {
  if (!fs.existsSync(templatePath)) return [...found];

  const content = fs.readFileSync(templatePath, 'utf-8');
  const componentRegex =
    /(?:include|import|extends)\s+['"](?:components\/)?([\w-]+)\.njk['"]/g;

  // Extract all component names using matchAll
  const matches = content.matchAll(componentRegex);
  for (const match of matches) {
    const compName = match[1];
    if (!found.has(compName)) {
      const compPath = resolveRoot(`${PATHS.SRC}/components/${compName}.njk`);
      if (fs.existsSync(compPath)) {
        found.add(compName);
        getUsedComponents(compPath, found);
      }
    }
  }

  return [...found];
};

/**
 * Generate the client-side i18n script.
 */
const generateClientI18nScript = (
  lang: string,
  name: string,
  usedComponents: string[],
  supportedLangs: string[],
  LANGUAGE_STORAGE_KEY: string,
  LANGUAGES: typeof import('@/configs/locales').LANGUAGES,
): string => {
  // Build i18n data for all supported languages
  const allI18nData = Object.fromEntries(
    supportedLangs.map((l) => [
      l,
      {
        common: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/common.json5`)),
        comp: loadSelectedComponentLocales(l, usedComponents, resolveRoot(PATHS.LOCALES)),
        page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${l}/${name}.json5`)),
      },
    ]),
  ) as Record<string, JsonData>;

  const langJson = JSON.stringify(lang);
  const nameJson = JSON.stringify(name);
  const componentsJson = JSON.stringify(usedComponents);
  const dataJson = JSON.stringify(allI18nData);
  const languagesJson = JSON.stringify(LANGUAGES);

  return `<script>
(() => {
  const defaultLng = ${langJson};
  const savedLng = localStorage.getItem('${LANGUAGE_STORAGE_KEY}') ?? defaultLng;
  const languages = ${languagesJson};

  window.__PAGE_ID__ = ${nameJson};
  window.__USED_COMPONENTS__ = ${componentsJson};
  window.__I18N_DATA__ = ${dataJson};
  window.__SAVED_LNG__ = savedLng;

  const htmlEl = document.documentElement;
  const langConfig = languages.find(l => l.code === savedLng);
  const dir = langConfig?.dir ?? 'ltr';

  htmlEl.setAttribute('dir', dir);
  htmlEl.setAttribute('lang', savedLng);

  htmlEl.classList.toggle('is-rtl', dir === 'rtl');
})();
</script>`;
};

/**
 * Create the i18n object with translation and formatting methods.
 */
const createI18nObject = (
  lang: string,
  _mergedLocales: JsonData,
  _resolve: (jsonPath: string, vars?: Record<string, unknown>) => string,
  normalizeI18nKey: (key: string) => { ns: string; clientKey: string },
): I18nObject => {
  // Set current language globally for all formatting functions
  setLanguage(lang);

  // Helper to create I18nItem - memoized via closure
  const createItem = (
    key: string | undefined,
    vars: Record<string, unknown> = {},
  ): I18nItem => {
    if (!key) {
      return {
        v: `[missing_key]`,
        k: 'common:site_name' as I18nTranslationKeys,
        vars: null,
      };
    }

    const { ns, clientKey } = normalizeI18nKey(key);
    const varsJson = Object.keys(vars).length ? JSON.stringify(vars) : null;

    return {
      v: _resolve(key, vars),
      k: `${ns}:${clientKey}` as I18nTranslationKeys,
      vars: varsJson,
    };
  };

  // Callable i18n function
  const i18nFn = (
    key: string | undefined,
    vars: Record<string, unknown> = {},
  ) => createItem(key, vars);

  // Helper to get normalized key string once
  const getNormalizedKeyStr = (key: string) => {
    const parts = normalizeI18nKey(key);
    return `${parts.ns}:${parts.clientKey}` as I18nTranslationKeys;
  };

  // Helper to get value only (shared by t and html)
  const getValue = (key: string | undefined, vars: Record<string, unknown> = {}) =>
    createItem(key, vars).v;

  return Object.assign(i18nFn, {
    t: getValue,
    html: getValue,
    attr: (key: string | undefined, attrName: string, vars: Record<string, unknown> = {}) =>
      `${attrName}="${createItem(key, vars).v}"`,
    // Format methods - lng is from global context
    formatNumber,
    formatPercent,
    formatBytes,
    formatDuration,
    formatDate,
    formatDateTime,
    formatOrdinal,
    formatCardinal,
    formatScientific,
    formatAbbreviated,
    formatList,
    formatCurrency,
    formatUnit,
    formatTime,
    getPluralSuffix,
    convertCurrency,
    localPrice,
    localPriceCurrency,
    convertLocalPrice,
    formatLocalPrice,
    formatLocalPriceDiscounted,
    pluralize: plural,
    singularize: singular,
    formatRelativeTime,
    nativeNumbers: toNativeDigits,
    // Override plural to handle i18n key lookup with suffix
    plural: (
      key: string | undefined,
      count: number,
      vars: Record<string, unknown> = {},
    ): I18nItem => {
      if (!key) return createItem(key, vars);

      const keyStr = getNormalizedKeyStr(key);
      const mergedVars = { ...vars, count };
      const lookupKey = `${key}${getPluralSuffix(count)}`;
      const item = createItem(lookupKey, mergedVars);

      return {
        v: item.v,
        k: keyStr,
        vars: item.vars,
      };
    },
  });
};

/**
 * Main function to create template parameters for Nunjucks rendering.
 */
export const createTemplateParams = (
  params: TemplateParams,
  LANGUAGE_STORAGE_KEY: string,
  SUPPORTED_LANG_CODES: string[],
): TemplateContext => {
  const name = String(params.entryName || 'home');
  const lang = DEFAULT_LANG;
  const isDev = process.env.NODE_ENV !== 'production';

  const templatePath = resolveRoot(`${PATHS.SRC}/pages/${name}/index.njk`);
  const usedComponents = getUsedComponents(templatePath);

  // Build locale data for current language
  const mergedLocales: JsonData = {
    ...readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/common.json5`)),
    page: readJSON5(resolveRoot(`${PATHS.LOCALES}/${lang}/${name}.json5`)),
    comp: loadSelectedComponentLocales(lang, usedComponents, resolveRoot(PATHS.LOCALES)),
  };

  // Resolve i18n key with variable interpolation
  const _resolve = (
    jsonPath: string,
    vars: Record<string, unknown> = {},
  ): string => {
    const val = getValueByPath(mergedLocales, jsonPath);
    let str = val !== undefined ? String(val) : jsonPath;

    if (val === undefined && isDev) {
      console.warn(`[i18n] Missing key "${jsonPath}" in locale "${lang}"`);
    }

    // Interpolate variables - use regex replaceAll for better performance
    for (const [key, value] of Object.entries(vars)) {
      str = str.replaceAll(`{{${key}}}`, String(value));
    }
    return str;
  };

  // Normalize i18n key to namespace and client key
  const normalizeI18nKey = (key: string): { ns: string; clientKey: string } => {
    if (key.startsWith('page.')) {
      return { ns: name, clientKey: key.slice(5) }; // 'page.'.length === 5
    }
    if (key.startsWith('comp.')) {
      const parts = key.split('.');
      return { ns: `components/${parts[1]}`, clientKey: parts.slice(2).join('.') };
    }
    return { ns: 'common', clientKey: key };
  };

  const i18n = createI18nObject(lang, mergedLocales, _resolve, normalizeI18nKey);

  const clientI18nScript = generateClientI18nScript(
    lang,
    name,
    usedComponents,
    SUPPORTED_LANG_CODES,
    LANGUAGE_STORAGE_KEY,
    LANGUAGES,
  );

  return {
    ...params,
    lang,
    clientI18nScript,
    page_id: name,
    global: loadGlobalData(resolveRoot(`${PATHS.SRC}/data`)),
    page: readJSON5(resolveRoot(`${PATHS.SRC}/pages/${name}/index.json5`)),
    i18n,
  };
};
