Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getDynamicImport = getDynamicImport;
var _loaderUtils = require('loader-utils');
var _stringify = require('../import-wrapper/stringify');
var _getImportStr = require('../utils/get-import-str');
function getDynamicImport(loaderContext, assetPath, assetImport, { esModule, importVar } = {}) {
  const args = assetImport.toArgs();
  const isDynamicImport = assetImport.isDynamic();
  let importPath;
  if (isDynamicImport) {
    importPath = (0, _stringify.stringify)(loaderContext, assetImport).toString();
  } else {
    const rawPath = assetImport.toString();
    const lastBangIndex = rawPath.lastIndexOf('!');
    if (lastBangIndex > 0) {
      const loaderPrefix = rawPath.substring(0, lastBangIndex + 1);
      const filePath = rawPath.substring(lastBangIndex + 1);
      importPath = loaderPrefix + (0, _loaderUtils.stringifyRequest)(loaderContext, filePath);
    } else {
      importPath = (0, _loaderUtils.stringifyRequest)(loaderContext, rawPath);
    }
  }
  return isDynamicImport
    ? `const ${importVar} = function(${args.join()}) {
            return ${((0, _getImportStr.getImportStr))(importPath, esModule, true)()}
        };`
    : `${((0, _getImportStr.getImportStr))(importPath, esModule)(importVar)}`;
}
