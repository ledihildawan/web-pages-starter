const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir)
  .map(f => path.join(localesDir, f, 'pricing.json5'))
  .filter(f => fs.existsSync(f));

let fixed = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // Fix the broken pattern from the bad bash script
    // Pattern: "pricing": { "badge": "..." }, },\n  "period_monthly":
    const fixedContent = content.replace(
      /(\s+)"pricing":\s*\{[^}]*"badge":\s*"[^"]*"[^}]*\},\s*\},\s*\n/g,
      ''
    );

    // Also handle the case where it ends with just },
    const cleaned = fixedContent.replace(
      /(\s+)"pricing":\s*\{[^}]*"badge":\s*"[^"]*"[^}]*\},\s*\},?/g,
      ''
    );

    // Remove empty lines that might be left
    const finalContent = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== finalContent) {
      fs.writeFileSync(file, finalContent);
      fixed++;
      console.log(`Cleaned: ${path.basename(path.dirname(file))}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nCleaned ${fixed} files`);

// Now run the original fix script
console.log('\nNow moving badge to hero...\n');
const JSON5 = require('json5');

let moved = 0;
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
      moved++;
      console.log(`Fixed: ${path.basename(path.dirname(file))}`);
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nMoved badge: ${moved} files`);
console.log(`Skipped: ${skipped} files`);
