import { buildCardinal } from './builder';

export const cardinal = buildCardinal('nol', (s) => `minus ${s}`, [
  {
    limit: 11,
    format: (n) => ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'][n],
  },
  {
    limit: 20,
    format: (n) =>
      [
        'sepuluh',
        'sebelas',
        'dua belas',
        'tiga belas',
        'empat belas',
        'lima belas',
        'enam belas',
        'tujuh belas',
        'delapan belas',
        'sembilan belas',
      ][n - 10],
  },
  {
    limit: 100,
    div: 10,
    format: (_, q, r, rec) =>
      r
        ? `${['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'][q]} ${rec(r)}`
        : [
            '',
            '',
            'dua puluh',
            'tiga puluh',
            'empat puluh',
            'lima puluh',
            'enam puluh',
            'tujuh puluh',
            'delapan puluh',
            'sembilan puluh',
          ][q],
  },
  {
    limit: 1_000,
    div: 100,
    format: (_, q, r, rec) => {
      if (r) {
        const prefix = q === 1 ? 'seratus' : `${rec(q)} ratus`;
        return `${prefix} ${rec(r)}`;
      }
      return q === 1 ? 'seratus' : `${rec(q)} ratus`;
    },
  },
  {
    limit: 1_000_000,
    div: 1_000,
    format: (_, q, r, rec) => {
      if (r) {
        const prefix = q === 1 ? 'seribu' : `${rec(q)} ribu`;
        return `${prefix} ${rec(r)}`;
      }
      return q === 1 ? 'seribu' : `${rec(q)} ribu`;
    },
  },
  {
    limit: 1_000_000_000,
    div: 1_000_000,
    format: (_, q, r, rec) => (r ? `${rec(q)} juta ${rec(r)}` : `${rec(q)} juta`),
  },
  {
    limit: 1_000_000_000_000,
    div: 1_000_000_000,
    format: (_, q, r, rec) => (r ? `${rec(q)} miliar ${rec(r)}` : `${rec(q)} miliar`),
  },
]);

export const ordinal = (num: number): string =>
  num < 11
    ? [
        'ke-',
        'kesatu',
        'kedua',
        'ketiga',
        'keempat',
        'kelima',
        'keenam',
        'ketujuh',
        'kedelapan',
        'kesembilan',
        'kesepuluh',
      ][num]
    : `ke-${num}`;
