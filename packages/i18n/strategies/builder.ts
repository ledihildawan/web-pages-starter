type CardinalRule = {
  limit: number;
  div?: number;
  format: (n: number, q: number, r: number, rec: (val: number) => string) => string;
};

export const buildCardinal = (zeroStr: string, negativeFmt: (val: string) => string, rules: CardinalRule[]) => {
  const formatter = (num: number): string => {
    if (num === 0) return zeroStr;
    if (num < 0) return negativeFmt(formatter(Math.abs(num)));

    for (const { limit, div, format } of rules) {
      if (num < limit) return format(num, Math.floor(num / (div ?? 1)), num % (div ?? 1), formatter);
    }
    return `${num}`;
  };
  return formatter;
};

export type { CardinalRule };
