Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.resolve = resolve;
var _pathe = require('pathe');
var _ImportLiteral = require('./ImportLiteral');
var _ImportSymbol = require('./ImportSymbol');
var _normalizeTrailingSlash = require('./normalize-trailing-slash');
/**
 * Joins template import with another path
 *
 * @param {string} prependPath
 * @param {ImportWrapper} templateImport
 */
function resolve(prependPath, templateImport) {
  const _templateImport = templateImport.concat();
  let firstPart = _templateImport.shift();
  if (firstPart instanceof _ImportSymbol.ImportSymbol) {
    _templateImport.unshift(firstPart);
    firstPart = '';
  }
  const resolvedPath = (0, _pathe.resolve)(prependPath, firstPart.valueOf());
  const normalizedPath = (0, _pathe.normalize)(resolvedPath);
  const filePath = (0, _normalizeTrailingSlash.normalizeTrailingSlash)(normalizedPath, firstPart);
  _templateImport.unshift(new _ImportLiteral.ImportLiteral(filePath));
  return _templateImport;
}
