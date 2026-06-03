const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir)
  .map(f => path.join(localesDir, f, 'pricing.json5'))
  .filter(f => fs.existsSync(f));

let fixed = 0;
let skipped = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON5.parse(content);

    // Check if pricing.badge exists and hero.badge doesn't
    if (data.pricing?.badge && !data.hero?.badge) {
      // Create hero object if it doesn't exist
      if (!data.hero) {
        data.hero = {};
      }
      // Move badge from pricing to hero
      data.hero.badge = data.pricing.badge;
      // Remove pricing object
      delete data.pricing;

      // Write back with proper formatting
      const output = JSON5.stringify(data, null, 2);
      fs.writeFileSync(file, output + '\n');
      fixed++;
      console.log(`Fixed: ${path.basename(path.dirname(file))}`);
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nFixed: ${fixed} files`);
console.log(`Skipped: ${skipped} files`);
