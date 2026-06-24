Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getAST = getAST;
var _addonsLoader = require('../addons-wrapper/addons-loader');
var _getNodes = require('../ast/get-nodes');
/**
 *
 * @param {string} source
 * @param {AddonWrapper[]} extensions
 * @param {NunjucksOptions} options
 * @returns {Promise<nunjucks.nodes.Root>}
 */
async function getAST(source, extensions, options) {
  await (0, _addonsLoader.addonsLoader)(extensions);
  return (0, _getNodes.getNodes)(
    source,
    extensions.map(({ instance }) => instance),
    options,
  );
}
