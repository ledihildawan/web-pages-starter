Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.resolveSearchPaths = resolveSearchPaths;
var _pathe = require('pathe');
var _ImportLiteral = require('../import-wrapper/ImportLiteral');
var _ImportWrapper = require('../import-wrapper/ImportWrapper');
var _resolve = require('../import-wrapper/resolve');
/**
 * @param {ImportWrapper} possiblePath
 * @param {Object}        webpackAlias
 * @returns {{path: ImportWrapper, wasAliased: boolean}}
 */
function applyWebpackAlias(possiblePath, webpackAlias) {
  if (possiblePath.isDynamic()) {
    const [firstItem] = possiblePath.importValue;
    if (firstItem instanceof _ImportLiteral.ImportLiteral) {
      const firstValue = firstItem.value;
      for (const [aliasName, aliasPath] of Object.entries(webpackAlias)) {
        if (firstValue.startsWith(aliasName + '/') || firstValue === aliasName) {
          const aliasValue = Array.isArray(aliasPath) ? aliasPath[0] : aliasPath;
          const remainingPath = firstValue.slice(aliasName.length);
          const normalizedRemaining = remainingPath.startsWith('/') ? remainingPath.slice(1) : remainingPath;
          const resolvedFirst = (0, _pathe.resolve)(aliasValue, normalizedRemaining);
          const newPath = possiblePath.map((item, index) => {
            if (index === 0 && item instanceof _ImportLiteral.ImportLiteral) {
              return new _ImportLiteral.ImportLiteral(resolvedFirst);
            }
            return item;
          });
          return {
            path: newPath,
            wasAliased: true,
          };
        }
      }
    }
    return {
      path: possiblePath,
      wasAliased: false,
    };
  }
  const pathStr = possiblePath.toString();
  for (const [aliasName, aliasPath] of Object.entries(webpackAlias)) {
    if (pathStr.startsWith(aliasName + '/') || pathStr === aliasName) {
      const aliasValue = Array.isArray(aliasPath) ? aliasPath[0] : aliasPath;
      const remainingPath = pathStr.slice(aliasName.length);
      const normalizedRemaining = remainingPath.startsWith('/') ? remainingPath.slice(1) : remainingPath;
      const resolvedPath = (0, _pathe.resolve)(aliasValue, normalizedRemaining);
      return {
        path: new _ImportWrapper.ImportWrapper([new _ImportLiteral.ImportLiteral(resolvedPath)]),
        wasAliased: true,
      };
    }
  }
  return {
    path: possiblePath,
    wasAliased: false,
  };
}

/**
 * Check if path looks like it starts from project root (contains fixtures/, src/, etc.)
 * @param {string} pathStr
 * @returns {boolean}
 */
function looksLikeProjectPath(pathStr) {
  return /^(test\/|src\/|lib\/)/.test(pathStr);
}

/**
 * @param {ImportWrapper} possiblePath
 * @param {string}        templateContext
 * @param {Object}        [webpackAlias]
 * @returns {ImportWrapper[]}
 */
function resolveSearchPaths(possiblePath, templateContext, webpackAlias = {}) {
  if (possiblePath.isDynamic()) {
    const { path: aliasedPath, wasAliased } = applyWebpackAlias(possiblePath, webpackAlias);
    if (wasAliased) {
      return [aliasedPath];
    }
    return [possiblePath];
  }
  const { path: aliasedPath, wasAliased } = applyWebpackAlias(possiblePath, webpackAlias);
  if (wasAliased) {
    return [aliasedPath];
  }
  const pathStr = possiblePath.toString();
  if (looksLikeProjectPath(pathStr)) {
    const fromRoot = (0, _resolve.resolve)('.', possiblePath);
    return [fromRoot];
  }
  return [(0, _resolve.resolve)(templateContext, aliasedPath)];
}
