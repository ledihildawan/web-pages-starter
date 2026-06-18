const path = require('node:path');
const fs = require('node:fs');

module.exports = function (source) {
  let imports = '';

  const stylePath = path.join(this.context, 'style.css');
  if (fs.existsSync(stylePath) && fs.statSync(stylePath).size > 0) {
    imports += `import './style.css';\n`;
  }

  const rel = path.relative(this.context, this.getOptions().bootstrap).replace(/\\/g, '/');
  imports += `import './${rel}';\n`;

  return imports + source;
};
