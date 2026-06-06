import { LOCALES, type LocaleCode } from './data';
import { LANGUAGE_CODE, LANGUAGES, SCRIPT_CODE } from './languages';
import { REGION_CODE, type RegionCode } from './regions';

const LOCALE_FALLBACK_TARGETS = {
  [LANGUAGE_CODE.ZH]: {
    Hans: { [REGION_CODE.CN]: [REGION_CODE.SG, REGION_CODE.MY] },
    Hant: { [REGION_CODE.TW]: [REGION_CODE.HK, REGION_CODE.MO] },
  },
  [LANGUAGE_CODE.EN]: {
    [REGION_CODE.GB]: [
      REGION_CODE.ZA,
      REGION_CODE.IE,
      REGION_CODE.SG,
      REGION_CODE.MY,
      REGION_CODE.HK,
    ],
    [REGION_CODE.AU]: [REGION_CODE.NZ],
  },
  [LANGUAGE_CODE.PT]: {
    [REGION_CODE.BR]: [REGION_CODE.AO, REGION_CODE.MZ],
  },
  [LANGUAGE_CODE.ES]: {
    [REGION_CODE.ES]: [
      REGION_CODE.MX,
      REGION_CODE.AR,
      REGION_CODE.CO,
      REGION_CODE.PE,
    ],
  },
  [LANGUAGE_CODE.FR]: {
    [REGION_CODE.FR]: [REGION_CODE.CA, REGION_CODE.BE, REGION_CODE.CH],
  },
  [LANGUAGE_CODE.DE]: {
    [REGION_CODE.DE]: [REGION_CODE.AT, REGION_CODE.CH],
  },
  [LANGUAGE_CODE.KO]: {
    [REGION_CODE.KR]: [REGION_CODE.KP],
  },
  [LANGUAGE_CODE.HI]: {
    [REGION_CODE.IN]: [REGION_CODE.NP],
  },
} as const;

export const LOCALE_FALLBACKS: Record<string, LocaleCode> = Object.entries(
  LOCALE_FALLBACK_TARGETS,
).reduce(
  (acc, [lang, scriptTargets]) => {
    if (typeof scriptTargets === 'object' && 'Hans' in scriptTargets) {
      Object.entries(scriptTargets).forEach(([script, targets]) => {
        Object.entries(targets).forEach(([region, sources]) => {
          const targetLocale = `${lang}-${script}-${region}` as LocaleCode;
          sources.forEach((source: RegionCode) => {
            acc[`${lang}-${script}-${source}`] = targetLocale;
          });
        });
      });
    } else {
      Object.entries(scriptTargets).forEach(([region, sources]) => {
        const targetLocale = `${lang}-${region}` as LocaleCode;
        sources.forEach((source: RegionCode) => {
          acc[`${lang}-${source}`] = targetLocale;
        });
      });
    }
    return acc;
  },
  {} as Record<string, LocaleCode>,
);

export const getLocaleLabel = (localeCode: LocaleCode): string => {
  const locale = LOCALES.find((l) => l.code === localeCode);
  if (!locale) return localeCode;

  const language = LANGUAGES.find((l) => l.code === locale.language);
  return language?.nativeName || localeCode;
};

const getLocaleDisplayRegion = (regionCode: RegionCode): string => {
  if (regionCode === REGION_CODE.GB) return 'UK';

  return regionCode;
};

export const getLocaleLabelCountry = (localeCode: LocaleCode): string => {
  const locale = LOCALES.find((l) => l.code === localeCode);
  if (!locale) return localeCode;

  const language = LANGUAGES.find((l) => l.code === locale.language);

  if (!language) return localeCode;

  let nativeName: string;
  if (locale.language === LANGUAGE_CODE.ZH && locale.script) {
    nativeName =
      locale.script === SCRIPT_CODE.HANS ? '简体中文' : '繁體中文';
  } else {
    nativeName = language.nativeName;
  }
  const regionSuffix = ` (${getLocaleDisplayRegion(locale.region)})`;

  return `${nativeName}${regionSuffix}`;
};

export const LOCALE_STORAGE_KEY = 'i18nextLocale' as const;
