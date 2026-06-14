import { buildCardinal } from './builder';

const zhDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const zhUnits = ['', '十', '百', '千', '万', '亿'];

export const cardinal = buildCardinal('〇', (s) => `负${s}`, [
  { limit: 10, format: (n) => zhDigits[n] },
  {
    limit: 20,
    div: 10,
    format: (n, _, r) => zhUnits[1] + (n > 10 ? zhDigits[r] : ''),
  },
  {
    limit: 100,
    div: 10,
    format: (_, q, r) => zhDigits[q] + zhUnits[1] + (r ? zhDigits[r] : ''),
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => zhDigits[q] + zhUnits[2] + (r ? rec(r) : ''),
  },
  {
    limit: 10_000,
    div: 1_000,
    format: (_, q, r, rec) => zhDigits[q] + zhUnits[3] + (r ? rec(r) : ''),
  },
  {
    limit: 100_000_000,
    div: 10_000,
    format: (_, q, r, rec) => rec(q) + zhUnits[4] + (r ? rec(r) : ''),
  },
  {
    limit: 1_000_000_000_000,
    div: 100_000_000,
    format: (_, q, r, rec) => rec(q) + zhUnits[5] + (r ? rec(r) : ''),
  },
]);
