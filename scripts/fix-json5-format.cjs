const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir)
  .map(f => path.join(localesDir, f, 'pricing.json5'))
  .filter(f => fs.existsSync(f));

let fixed = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON5.parse(content);

    // Write back as proper JSON (with quotes)
    const output = JSON.stringify(data, null, 2);
    fs.writeFileSync(file, output + '\n');
    fixed++;
    console.log(`Fixed format: ${path.basename(path.dirname(file))}`);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nFixed ${fixed} files`);
