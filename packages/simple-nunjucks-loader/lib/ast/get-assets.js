Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getAssets = getAssets;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _StaticExtension = require('../../public/static-extension/StaticExtension');
var _constants = require('../constants');
var _ImportWrapper = require('../import-wrapper/ImportWrapper');
var _getFirstExistedPath = require('../utils/get-first-existed-path');
var _getPossiblePaths = require('../utils/get-possible-paths');
var _isUniqueAsset = require('../utils/is-unique-asset');
var _getAddNodeValue = require('./get-add-node-value');
var _getNodesValues = require('./get-nodes-values');
var _isExtension = require('./is-extension');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function getNodeValue(node) {
  if (!(0, _isExtension.isExtension)(node, _StaticExtension.StaticExtension)) {
    return;
  }
  const [asset] = node.args.children;
  if (asset instanceof _nunjucks.default.nodes.Add) {
    return (0, _getAddNodeValue.getAddNodeValue)(asset);
  }
  const value = new _ImportWrapper.ImportWrapper();
  if (asset instanceof _nunjucks.default.nodes.Symbol) {
    value.addSymbol(asset.value);
  }
  if (asset instanceof _nunjucks.default.nodes.Literal) {
    value.addLiteral(asset.value);
  }
  return value;
}
async function filterPaths([path, paths]) {
  try {
    const importPath = await (0, _getFirstExistedPath.getFirstExistedPath)(paths);
    return [path, importPath];
  } catch (error) {
    if (error.code !== _constants.ERROR_MODULE_NOT_FOUND) {
      throw new Error(`Asset "${path}" not found`);
    }
    throw error;
  }
}

/**
 * @param {nunjucks.nodes.Root} nodes
 * @param {string[]}            searchAssets
 * @returns {Promise<[ImportWrapper, ImportWrapper][]>}
 */
function getAssets(nodes, searchAssets) {
  const assets = (0, _getNodesValues.getNodesValues)(
    nodes,
    _nunjucks.default.nodes.CallExtensionAsync,
    getNodeValue,
  ).filter(_isUniqueAsset.isUniqueAsset);
  const possiblePaths = (0, _getPossiblePaths.getPossiblePaths)(assets, searchAssets);
  const resolvedAssets = possiblePaths.map(filterPaths);
  return Promise.all(resolvedAssets);
}
