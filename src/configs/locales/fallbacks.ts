import { type LocaleCode } from './data';
import { LANGUAGE_CODE } from './languages';
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
