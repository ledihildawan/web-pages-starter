import fs from 'node:fs';
import { lookup } from '@generated/paths';
import { log } from '@scripts/lib/logger';
import { generatedHeader, writeFilePath } from '@scripts/lib/write-file';
import { readJSON5 } from '@utils/json5';

const PRICE_KEY_PATTERN = /^price_([a-z]{3})$/;
const OUTPUT_FILE = lookup('@generated', 'pricing.d.ts');

function extractPriceKeys(obj: unknown, currencies: Set<string>): void {
  if (typeof obj !== 'object' || obj === null) return;

  for (const [key, value] of Object.entries(obj)) {
    const match = key.match(PRICE_KEY_PATTERN);
    if (match) {
      currencies.add(match[1]);
    }
    if (typeof value === 'object' && value !== null) {
      extractPriceKeys(value, currencies);
    }
  }
}

function main(): void {
  const pricingPath = lookup('@pages', 'pricing', 'data.json5');

  if (!fs.existsSync(pricingPath)) {
    log.warn(`Pricing data not found at ${pricingPath}`);
    return;
  }

  const currencies = new Set<string>();
  try {
    const data = readJSON5(pricingPath);
    extractPriceKeys(data, currencies);
  } catch (error) {
    log.warn(`Could not read pricing data: ${error}`);
    return;
  }

  if (currencies.size === 0) {
    log.warn('No price_* keys found in pricing data');
    return;
  }

  const sortedCurrencies = Array.from(currencies).sort();
  const requiredCurrency = sortedCurrencies.includes('usd') ? 'price_usd' : sortedCurrencies[0];

  const optionalCurrencies = sortedCurrencies
    .filter((c) => c !== requiredCurrency.replace('price_', ''))
    .map((c) => `  price_${c}?: number;`)
    .join('\n');

  const typeContent = `${generatedHeader('scripts/generators/generate-pricing-types.ts', {
    description: `Generated from: ${pricingPath}\nCurrencies: ${sortedCurrencies.join(', ')}`,
  })}

export interface RegionalPrice {
  prices: {
    ${requiredCurrency}: number;
${optionalCurrencies}
    [key: string]: number | undefined;
  };
}
`;

  writeFilePath(OUTPUT_FILE, typeContent);
  log.info(`Generated pricing types for: ${sortedCurrencies.join(', ')}`);
}

main();
