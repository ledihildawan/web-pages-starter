Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getUsedGlobals = getUsedGlobals;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _getUsagesOf = require('./get-usages-of');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * @param {nunjucks.nodes.FunCall} functionNode
 * @returns {function(AddonWrapper): boolean}
 */
function getFunctionNodeMatcher(functionNode) {
  /**
   * @param {AddonWrapper} addon
   * @returns {boolean}
   */
  function isSameFunction(addon) {
    return functionNode.name.value === addon.name;
  }
  return isSameFunction;
}

/**
 * Filter list of globals
 *
 * @param {nunjucks.nodes.Root}     nodes
 * @param {AddonWrapper[]} globals
 * @returns {AddonWrapper[]}
 */
function getUsedGlobals(nodes, globals) {
  return (0, _getUsagesOf.getUsagesOf)(_nunjucks.default.nodes.FunCall, nodes)(globals, getFunctionNodeMatcher);
}
