Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getUsedFilters = getUsedFilters;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _getUsagesOf = require('./get-usages-of');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function getFilterNodeMatcher(filterNode) {
  /**
   * @param {AddonWrapper} addon
   * @returns {boolean}
   */
  function isSameNode(addon) {
    return addon.name === filterNode.name.value;
  }
  return isSameNode;
}

/**
 * @param {nunjucks.nodes.Root} nodes
 * @param {AddonWrapper[]}      instances
 * @returns {AddonWrapper[]}
 */
function getUsedFilters(nodes, instances) {
  return (0, _getUsagesOf.getUsagesOf)(_nunjucks.default.nodes.Filter, nodes)(instances, getFilterNodeMatcher);
}
