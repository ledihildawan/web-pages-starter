import { EXCHANGE_RATES } from '@generated/exchange-rates';

export function convertCurrencyRaw(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = EXCHANGE_RATES,
): number {
  if (from === to) return amount;

  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    console.warn(`[exchange-rates] Missing rate for ${!fromRate ? from : to}`);
    return amount;
  }

  return (amount / fromRate) * toRate;
}
