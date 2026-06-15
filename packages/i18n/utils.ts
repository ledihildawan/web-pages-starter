import { readJSON5 } from '../core/utils/json5';
import type { JsonData } from '../core/utils/types';

export const loadSharedLocales = (
  lang: string,
  names: string[],
  localesDir: string,
): JsonData => {
  const data: JsonData = {};
  for (const name of names) {
    const d = readJSON5(`${localesDir}/${lang}/${name}.json`);
    if (Object.keys(d).length > 0) {
      data[name] = d;
    }
  }
  return data;
};
