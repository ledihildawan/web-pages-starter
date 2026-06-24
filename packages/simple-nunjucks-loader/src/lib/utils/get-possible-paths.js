import { resolveSearchPaths } from './resolve-search-paths';

/**
 * @param {ImportWrapper[]} paths
 * @param {string} templateContext
 * @param {Object} [webpackAlias]
 * @returns {Array.<[ImportWrapper, ImportWrapper[]]>}
 */
export function getPossiblePaths(paths, templateContext, webpackAlias = {}) {
  return paths.map((possiblePath) => {
    const resolved = resolveSearchPaths(possiblePath, templateContext, webpackAlias);
    return [possiblePath, resolved];
  });
}
