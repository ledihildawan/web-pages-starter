import { buildCardinal } from './builder';

export const cardinal = (
  num: number,
  gender: 'masculine' | 'feminine' = 'masculine',
) => {
  const units = {
    masculine: [
      '',
      'واحِد',
      'اِثنان',
      'ثَلاثة',
      'أرْبَعَة',
      'خَمْسة',
      'سِتَّة',
      'سَبْعَة',
      'ثَمانِية',
      'تِسْعة',
    ],
    feminine: [
      '',
      'واحِدَة',
      'اِثنتان',
      'ثَلالث',
      'أرْبَع',
      'خَمس',
      'سِتّ',
      'سَبع',
      'ثَمان',
      'تِسع',
    ],
  }[gender];

  const tenWord = gender === 'feminine' ? 'عَشر' : 'عَشرة';
  const teens = {
    masculine: [
      '',
      'أحدَ عشر',
      'اِثنا عشر',
      'ثَلاثة عشر',
      'أربَعة عشر',
      'خَمسة عشر',
      'سِتَّة عشر',
      'سَبعَة عشر',
      'ثَمانية عشر',
      'تِسعة عشر',
    ],
    feminine: [
      '',
      'إحدى عَشرة',
      'اِثنتا عَشرة',
      'ثَلالثَ عَشرة',
      'أربَعَ عَشرة',
      'خَمسَ عَشرة',
      'سِتَّ عَشرة',
      'سَبعَ عَشرة',
      'ثَمانَ عَشرة',
      'تِسعَ عَشرة',
    ],
  }[gender];

  const tens = [
    '',
    '',
    'عشرون',
    'ثَلالثون',
    'أربَعون',
    'خَمسون',
    'سِتّون',
    'سَبعون',
    'ثَمانون',
    'تِسْعون',
  ];

  return buildCardinal('صِفْر', (s) => `سالب ${s}`, [
    {
      limit: 11,
      format: (n) => (n === 10 ? tenWord : units[n]),
    },
    {
      limit: 20,
      format: (n) => teens[n - 10],
    },
    {
      limit: 100,
      div: 10,
      format: (_, q, r) => {
        if (r === 0) return tens[q];
        return `${units[r]} و${tens[q]}`;
      },
    },
    {
      limit: 1_000,
      div: 100,
      format: (_, q, r, rec) => {
        const hundreds = [
          '',
          'مِئة',
          'مِئتان',
          'ثَلالث مِئة',
          'أربَع مِئة',
          'خَمس مِئة',
          'سِتّ مِئة',
          'سَبع مِئة',
          'ثَمان مِئة',
          'تِسع مِئة',
        ];
        const prefix = hundreds[q];
        return r ? `${prefix} و${rec(r)}` : prefix;
      },
    },
    {
      limit: 1_000_000,
      div: 1_000,
      format: (_, q, r, rec) => {
        const two = 'ألفان';
        const plural = `${rec(q)} آلاف`;
        const singular = `${rec(q)} ألف`;
        let tw: string;
        if (q === 1) tw = 'ألف';
        else if (q === 2) tw = two;
        else if (q >= 3 && q < 11) tw = plural;
        else tw = singular;
        return r ? `${tw} و${rec(r)}` : tw;
      },
    },
    {
      limit: 1_000_000_000_000,
      div: 1_000_000,
      format: (_, q, r, rec) => {
        const two = 'مليونان';
        const plural = `${rec(q)} ملايين`;
        const singular = `${rec(q)} مليون`;
        let tw: string;
        if (q === 1) tw = 'مليون';
        else if (q === 2) tw = two;
        else if (q >= 3 && q < 11) tw = plural;
        else tw = singular;
        return r ? `${tw} و${rec(r)}` : tw;
      },
    },
  ])(num);
};

export const ordinal = (num: number): string => {
  if (num < 1) return `${num}`;
  if (num < 11)
    return [
      '',
      'أول',
      'ثان',
      'ثالث',
      'رابع',
      'خامس',
      'سادس',
      'سابع',
      'ثامن',
      'تاسع',
      'عاشر',
    ][num];
  if (num < 20)
    return [
      '',
      'الحادي عشر',
      'الثاني عشر',
      'الثالث عشر',
      'الرابع عشر',
      'الخامس عشر',
      'السادس عشر',
      'السابع عشر',
      'الثامن عشر',
      'التاسع عشر',
    ][num - 10];
  if (num < 100) {
    const tens = [
      '',
      'العشرون',
      'الثلاثون',
      'الأربعون',
      'الخمسون',
      'الستون',
      'السبعون',
      'الثمانون',
      'التسعون',
    ];
    const rem = num % 10;
    if (rem === 0) return tens[Math.floor(num / 10)];
    if (rem === 1) return `الحادي و${tens[Math.floor(num / 10)]}`;
    if (rem === 2) return `الثاني و${tens[Math.floor(num / 10)]}`;
    return `${['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'][rem]} و${tens[Math.floor(num / 10)]}`;
  }
  return `ال${cardinal(num)}`;
};
