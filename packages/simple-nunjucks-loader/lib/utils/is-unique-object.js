Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isUniqueObject = isUniqueObject;
/**
 * @template TItem
 * @param {function(TItem[], TItem): number} getIndex
 * @returns {function(TItem, number, TItem[]): boolean}
 */
function isUniqueObject(getIndex) {
  /**
   * @template TItem
   * @param {TItem} item
   * @param {number} index
   * @param {TItem[]} list
   * @returns {boolean}
   */
  function compareIndexes(item, index, list) {
    return getIndex(list, item) === index;
  }
  return compareIndexes;
}
