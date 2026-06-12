/**
 * Stub — overwritten by tools/fetch-exchange-rates.ts
 *
 * WARNING: DO NOT EDIT MANUALLY
 */

export const EXCHANGE_RATES: Record<string, number> = {};

export function convertCurrency(
  _amount: number,
  _from: string,
  _to: string,
  _rates: Record<string, number> = EXCHANGE_RATES
): number {
  return _amount;
}
