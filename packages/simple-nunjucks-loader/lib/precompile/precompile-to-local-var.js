Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.precompileToLocalVar = precompileToLocalVar;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _localVarWrapper = require('./local-var-wrapper');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * @param {string}      source
 * @param {string}      fileName
 * @param {nunjucks.Environment} env
 * @returns {string} Precompiled template, assigned to given `fileName`
 */
function precompileToLocalVar(source, fileName, env) {
  return _nunjucks.default.precompileString(source, {
    env,
    name: fileName,
    wrapper: _localVarWrapper.localVarWrapper,
  });
}
