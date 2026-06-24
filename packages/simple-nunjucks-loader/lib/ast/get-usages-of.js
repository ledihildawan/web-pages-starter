Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getUsagesOf = getUsagesOf;
var _isUniqueObject = require('../utils/is-unique-object');
var _toListItem = require('../utils/to-list-item');
const isUniqueNode = (0, _isUniqueObject.isUniqueObject)(getNodeIndex);

/**
 * @param {nunjucks.nodes.Node[]} list
 * @param {nunjucks.nodes.Node} item
 * @returns {number}
 */
function getNodeIndex(list, item) {
  return list.findIndex((anotherItem) => item.name === anotherItem.name);
}

/**
 * Filter list of nodes
 *
 * @template TNode
 * @param {nunjucks.nodes.Node} nodeType
 * @param {nunjucks.nodes.Root} nodes
 * @returns {function(TNode[], function(TNode): Function): TNode[]}
 */
function getUsagesOf(nodeType, nodes) {
  const nodesOfType = nodes.findAll(nodeType);

  /**
   * @template TNode
   * @param {TNode[]} list
   * @param {function(Object<TNode>): function(TNode): boolean} callback
   * @returns {TNode[]}
   */
  function filterNodes(list, callback) {
    return nodesOfType
      .map((0, _toListItem.toListItem)(list, callback))
      .filter(Boolean)
      .filter(isUniqueNode);
  }
  return filterNodes;
}
