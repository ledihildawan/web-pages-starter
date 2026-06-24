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

<<<<<<< Updated upstream
  if (mainCss) addImport(mainCss);
  if (bootstrap) addImport(bootstrap);

  const stylePath = join(this.context, pageStyle);
  if (fs.existsSync(stylePath) && fs.statSync(stylePath).size > 0) addImport(stylePath);
||||||| Stash base
  const rel = path.relative(this.context, this.getOptions().bootstrap).replace(/\\/g, '/');
  imports += `import './${rel}';\n`;
=======
  imports += `import '@shared/bootstrap';\n`;
>>>>>>> Stashed changes

  return imports + source;
};
