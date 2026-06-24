Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isNotSymbolOrLiteral = void 0;
var _ImportLiteral = require('./ImportLiteral');
var _isSymbol = require('./is-symbol');
function and(...fns) {
  return (...args) => fns.reduce((a, b) => (a === null || a === void 0 ? void 0 : a(...args)) && b(...args));
}
function not(fn) {
  return function isNot(...args) {
    return !fn(...args);
  };
}
function isLiteral(value) {
  return value instanceof _ImportLiteral.ImportLiteral;
}
const isNotSymbolOrLiteral = (exports.isNotSymbolOrLiteral = and(not(isLiteral), not(_isSymbol.isSymbol)));
