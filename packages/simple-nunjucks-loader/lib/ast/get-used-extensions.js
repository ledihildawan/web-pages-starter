Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getUsedExtensions = getUsedExtensions;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _getUsagesOf = require('./get-usages-of');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * @param {nunjucks.nodes.CallExtension} extensionNode
 * @returns {function(AddonWrapper)}
 */
function getExtensionNodeMatcher(extensionNode) {
  const { extName } = extensionNode;

  /**
   * @param {AddonWrapper} addon
   * @returns {boolean}
   */
  function isSameNode(addon) {
    // Sometime `extName` is instance of custom tag
    return addon.name === extName || addon.instance === extName;
  }
  return isSameNode;
}

/**
 * @param {nunjucks.nodes.Root} nodes
 * @param {AddonWrapper[]}      instances
 * @returns {AddonWrapper[]}
 */
function getUsedExtensions(nodes, instances) {
  return (0, _getUsagesOf.getUsagesOf)(_nunjucks.default.nodes.CallExtension, nodes)(
    instances,
    getExtensionNodeMatcher,
  );
}
