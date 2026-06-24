Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getRuntimeImport = getRuntimeImport;
var _loaderUtils = require('loader-utils');
var _getImportStr = require('../utils/get-import-str');
const runtimeFilePath = require.resolve('../../public/runtime.js');
function getRuntimeImport(loaderContext, esModule) {
  const runtimePath = (0, _loaderUtils.stringifyRequest)(loaderContext, `${runtimeFilePath}`);
  return `${((0, _getImportStr.getImportStr))(runtimePath, esModule)('runtime')}`;
}
