Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getTemplatePath = getTemplatePath;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _ImportWrapper = require('../import-wrapper/ImportWrapper');
var _getAddNodeValue = require('./get-add-node-value');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * @param {nunjucks.Node} node
 * @returns {ImportWrapper}
 */
function getTemplatePath(node) {
  const template = node.template;
  if (template instanceof _nunjucks.default.nodes.Add) {
    return (0, _getAddNodeValue.getAddNodeValue)(template);
  }
  const value = new _ImportWrapper.ImportWrapper();
  if (template instanceof _nunjucks.default.nodes.Symbol) {
    return value.addSymbol(template.value);
  }
  return value.addLiteral(template.value);
}
