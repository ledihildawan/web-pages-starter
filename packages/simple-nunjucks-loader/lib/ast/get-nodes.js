Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getNodes = getNodes;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
/**
 * @param {string}          source
 * @param {function[]}      extensions
 * @param {NunjucksOptions} options
 *
 * @returns {nunjucks.nodes.Root}
 */
function getNodes(source, extensions, options) {
  return _nunjucks.default.parser.parse(source, extensions, options);
}
