Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getAddonsMeta = getAddonsMeta;
var _AddonWrapper = require('../addons-wrapper/AddonWrapper');
var _FilterWrapper = require('../addons-wrapper/FilterWrapper');
/**
 * @param {Object.<string, string>} addons
 * @param {Object} options
 * @param {string} options.type
 * @param {Object} options.loaderContext
 * @param {boolean} options.es
 * @returns {AddonWrapper[]}
 */
function getAddonsMeta(addons, options) {
  let Klass = _AddonWrapper.AddonWrapper;
  if (options.type === 'filters') {
    Klass = _FilterWrapper.FilterWrapper;
  }
  return Object.entries(addons).map(
    ([name, importPath]) =>
      new Klass({
        ...options,
        name,
        importPath,
      }),
  );
}
