Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.wrapAddons = wrapAddons;
var _getWrappedAddons = require('./get-wrapped-addons');
/**
 * @typedef {AddonWrapper[]} InstancesList
 */

/**
 * Wraps addons (extensions, filters, globals) to manage their imports
 *
 * @param {Object.<string, string>} extensions
 * @param {Object.<string, string>} filters
 * @param {Object.<string, string>} globals
 * @param {Object} options
 * @param {Object} options.loaderContext
 * @param {boolean} options.es
 * @returns {Object.<string, InstancesList>}
 */
function wrapAddons(extensions, filters, globals, options) {
  const _extensions = (0, _getWrappedAddons.getWrappedAddons)(extensions, {
    ...options,
    type: 'extensions',
  });
  const _filters = (0, _getWrappedAddons.getWrappedAddons)(filters, {
    ...options,
    type: 'filters',
  });
  const _globals = (0, _getWrappedAddons.getWrappedAddons)(globals, {
    ...options,
    type: 'globals',
  });
  return {
    extensions: _extensions,
    filters: _filters,
    globals: _globals,
  };
}
