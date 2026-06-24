Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isExtension = isExtension;
/**
 * @param {nunjucks.nodes.Node} node
 * @param {Function}            ExtensionClass
 * @return {boolean}
 */
function isExtension(node, ExtensionClass) {
  return node.extName instanceof ExtensionClass || node.extName === ExtensionClass.name;
}
