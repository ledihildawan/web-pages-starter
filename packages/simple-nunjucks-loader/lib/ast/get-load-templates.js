Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getLoadTemplates = getLoadTemplates;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _ImportWrapper = require('../import-wrapper/ImportWrapper');
var _ImportLiteral = require('../import-wrapper/ImportLiteral');
var _getFirstExistedPath = require('../utils/get-first-existed-path');
var _getPossiblePaths = require('../utils/get-possible-paths');
var _isUniqueAsset = require('../utils/is-unique-asset');
var _getAddNodeValue = require('./get-add-node-value');
var _getNodesValues = require('./get-nodes-values');
var _getGlob = require('../utils/get-glob');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function getNodeValue(node) {
  if (!node.tags || !node.tags.includes('load')) {
    return;
  }
  const [pathArg] = node.args.children;
  if (!pathArg) {
    return;
  }
  if (pathArg instanceof _nunjucks.default.nodes.Add) {
    return (0, _getAddNodeValue.getAddNodeValue)(pathArg);
  }
  const value = new _ImportWrapper.ImportWrapper();
  if (pathArg instanceof _nunjucks.default.nodes.Symbol) {
    value.addSymbol(pathArg.value);
  }
  if (pathArg instanceof _nunjucks.default.nodes.Literal) {
    value.addLiteral(pathArg.value);
  }
  return value;
}
async function getLoadTemplates(nodes, templateContext, webpackAlias = {}) {
  const callExtNodes = (0, _getNodesValues.getNodesValues)(
    nodes,
    _nunjucks.default.nodes.CallExtension,
    getNodeValue,
  ).filter(_isUniqueAsset.isUniqueAsset);
  const possiblePaths = (0, _getPossiblePaths.getPossiblePaths)(callExtNodes, templateContext, webpackAlias);

  const results = [];
  for (const [originalPath, resolvedPath] of possiblePaths) {
    if (resolvedPath.isDynamic()) {
      const glob = await (0, _getGlob.getGlob)();
      const globPattern = resolvedPath.toGlob().replace(/\\/g, '/');
      const files = await glob(globPattern);
      for (const file of files) {
        const normalizedFile = file.replace(/\\/g, '/');
        const filePath = new _ImportWrapper.ImportWrapper([new _ImportLiteral.ImportLiteral(normalizedFile)]);
        results.push([originalPath, filePath]);
      }
      if (files.length === 0) {
        throw new Error(`Load template glob "${globPattern}" matched no files`);
      }
    } else {
      const importPath = await (0, _getFirstExistedPath.getFirstExistedPath)([originalPath, resolvedPath]);
      results.push([originalPath, importPath]);
    }
  }
  return results;
}
