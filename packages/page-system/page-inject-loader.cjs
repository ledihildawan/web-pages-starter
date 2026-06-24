const { relative, join, normalize } = require('pathe');
const fs = require('node:fs');

module.exports = function (source) {
  const { bootstrap, mainCss, pageStyle = 'style.css' } = this.getOptions() || {};
  let imports = '';

  const addImport = (filePath) => {
    const relativePath = normalize(relative(this.context, filePath));
    const normalizedPath = relativePath.startsWith('../') ? relativePath : `./${relativePath}`;
    imports += `import '${normalizedPath}';\n`;
  };

  if (mainCss) addImport(mainCss);
  if (bootstrap) addImport(bootstrap);

  const stylePath = join(this.context, pageStyle);
  if (fs.existsSync(stylePath) && fs.statSync(stylePath).size > 0) addImport(stylePath);

  return imports + source;
};
