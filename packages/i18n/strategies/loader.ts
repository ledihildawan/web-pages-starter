export type StrategyBundle = {
  cardinal: Record<string, (num: number, gender?: 'masculine' | 'feminine') => string>;
  ordinal: Record<string, (num: number) => string>;
};

const strategyCache = new Map<string, StrategyBundle>();

export async function loadStrategies(lang: string): Promise<StrategyBundle> {
  const cached = strategyCache.get(lang);
  if (cached) return cached;

  let bundle: StrategyBundle;
  switch (lang) {
    case 'id': {
      const m = await import('./id');
      bundle = { cardinal: { id: m.cardinal }, ordinal: { id: m.ordinal } };
      break;
    }
    case 'ja': {
      const m = await import('./ja');
      bundle = { cardinal: { ja: m.cardinal }, ordinal: { ja: m.ordinal } };
      break;
    }
    case 'zh': {
      const m = await import('./zh');
      bundle = { cardinal: { zh: m.cardinal }, ordinal: {} };
      break;
    }
    case 'ar': {
      const m = await import('./ar');
      bundle = { cardinal: { ar: m.cardinal }, ordinal: { ar: m.ordinal } };
      break;
    }
    default:
      bundle = { cardinal: {}, ordinal: {} };
  }
  strategyCache.set(lang, bundle);
  return bundle;
}
