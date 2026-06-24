Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getPossiblePaths = getPossiblePaths;
var _resolveSearchPaths = require('./resolve-search-paths');
/**
 * @param {ImportWrapper[]} paths
 * @param {string} templateContext
 * @param {Object} [webpackAlias]
 * @returns {Array.<[ImportWrapper, ImportWrapper[]]>}
 */
function getPossiblePaths(paths, templateContext, webpackAlias = {}) {
  return paths.map((possiblePath) => {
    const resolved = (0, _resolveSearchPaths.resolveSearchPaths)(possiblePath, templateContext, webpackAlias);
    return [possiblePath, resolved];
  });
}
