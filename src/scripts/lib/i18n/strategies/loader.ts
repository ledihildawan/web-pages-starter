export type StrategyBundle = {
  cardinal: Record<
    string,
    (num: number, gender?: 'masculine' | 'feminine') => string
  >;
  ordinal: Record<string, (num: number) => string>;
};

export async function loadStrategies(lang: string): Promise<StrategyBundle> {
  switch (lang) {
    case 'id': {
      const m = await import('./id');
      return { cardinal: { id: m.cardinal }, ordinal: { id: m.ordinal } };
    }
    case 'ja': {
      const m = await import('./ja');
      return { cardinal: { ja: m.cardinal }, ordinal: { ja: m.ordinal } };
    }
    case 'zh': {
      const m = await import('./zh');
      return { cardinal: { zh: m.cardinal }, ordinal: {} };
    }
    case 'ar': {
      const m = await import('./ar');
      return { cardinal: { ar: m.cardinal }, ordinal: { ar: m.ordinal } };
    }
    default:
      return { cardinal: {}, ordinal: {} };
  }
}
