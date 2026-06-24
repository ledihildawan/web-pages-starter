Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.loadDependencies = loadDependencies;
var _getAddonsMeta = require('./get-addons-meta');
/**
 * @typedef {((string | Function)[])[]} InstancesList
 */

/**
 * Load filters and extensions modules
 *
 * @param {Object.<string, string>} extensions
 * @param {Object.<string, string>} filters
 * @param {Object} options
 * @param {Object} options.loaderContext
 * @param {boolean} options.es
 * @returns {Promise<{filters: InstancesList, extensions: InstancesList, nodes: nunjucks.nodes.Root}>}
 */
function loadDependencies(extensions, filters, options) {
  const _extensions = (0, _getAddonsMeta.getAddonsMeta)(extensions, {
    ...options,
    type: 'extensions',
  });
  const _filters = (0, _getAddonsMeta.getAddonsMeta)(filters, {
    ...options,
    type: 'filters',
  });
  return {
    extensions: _extensions,
    filters: _filters,
  };
}
