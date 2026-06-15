import { buildCardinal } from './builder';

const jpDigits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const jpUnits = ['', '十', '百', '千', '万', '億', '兆'];

export const cardinal = buildCardinal('〇', (s) => `マイナス${s}`, [
  { limit: 10, format: (n) => jpDigits[n] },
  {
    limit: 100,
    div: 10,
    format: (_, q, r) => (q === 1 ? '' : jpDigits[q]) + jpUnits[1] + (r ? jpDigits[r] : ''),
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => (q === 1 ? '' : jpDigits[q]) + jpUnits[2] + (r ? rec(r) : ''),
  },
  {
    limit: 10_000,
    div: 1_000,
    format: (_, q, r, rec) => (q === 1 ? '' : jpDigits[q]) + jpUnits[3] + (r ? rec(r) : ''),
  },
  {
    limit: 100_000_000,
    div: 10_000,
    format: (_, q, r, rec) => rec(q) + jpUnits[4] + (r ? rec(r) : ''),
  },
  {
    limit: 1_000_000_000_000,
    div: 100_000_000,
    format: (_, q, r, rec) => rec(q) + jpUnits[5] + (r ? rec(r) : ''),
  },
]);

export const ordinal = (num: number): string => `第${num < 1 ? num : cardinal(num)}`;
