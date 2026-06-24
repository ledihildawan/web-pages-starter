Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getNodesValues = getNodesValues;
/**
 * @template TValue
 * @param {nunjucks.nodes.Root}             nodes
 * @param {nunjucks.Node|nunjucks.Node[]}   nodeType
 * @param {function(nunjucks.Node): TValue} getValue
 * @returns {TValue[]}
 */
function getNodesValues(nodes, nodeType, getValue) {
  const nodesOfType = [].concat(nodeType).flatMap((nodeType) => nodes.findAll(nodeType));
  return nodesOfType.map(getValue).filter(Boolean);
}
