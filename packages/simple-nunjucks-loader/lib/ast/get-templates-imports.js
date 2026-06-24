Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getTemplatesImports = getTemplatesImports;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _getFirstExistedPath = require('../utils/get-first-existed-path');
var _getPossiblePaths = require('../utils/get-possible-paths');
var _isUniqueAsset = require('../utils/is-unique-asset');
var _getNodesValues = require('./get-nodes-values');
var _getTemplatePath = require('./get-template-path');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * Find first existed path
 *
 * @param {string} path
 * @param {ImportWrapper[]} paths
 * @returns {Promise<string[]>}
 */
async function filterPaths([path, paths]) {
  try {
    const importPath = await (0, _getFirstExistedPath.getFirstExistedPath)(paths);
    return [path, importPath];
  } catch {
    throw new Error(`Template "${path}" not found`);
  }
}
const nodeTypes = [
  _nunjucks.default.nodes.Extends,
  _nunjucks.default.nodes.Include,
  _nunjucks.default.nodes.Import,
  _nunjucks.default.nodes.FromImport,
];

/**
 * @param {Object} loaderContext
 * @param {nunjucks.nodes.Root} nodes
 * @param {string}            templateContext
 * @param {Object}             [webpackAlias]
 * @returns {Promise<[ImportWrapper, ImportWrapper][]>}
 */
function getTemplatesImports(loaderContext, nodes, templateContext, webpackAlias = {}) {
  const templateDeps = (0, _getNodesValues.getNodesValues)(nodes, nodeTypes, _getTemplatePath.getTemplatePath).filter(
    _isUniqueAsset.isUniqueAsset,
  );
  const possiblePaths = (0, _getPossiblePaths.getPossiblePaths)(templateDeps, templateContext, webpackAlias);
  const resolvedTemplates = possiblePaths.map(filterPaths);
  return Promise.all(resolvedTemplates);
}
