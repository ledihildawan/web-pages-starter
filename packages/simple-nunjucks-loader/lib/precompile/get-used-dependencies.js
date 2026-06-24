Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getUsedDependencies = getUsedDependencies;
var _pathe = require('pathe');
var _getTemplatesImports = require('../ast/get-templates-imports');
var _getUsedExtensions = require('../ast/get-used-extensions');
var _getUsedFilters = require('../ast/get-used-filters');
var _getUsedGlobals = require('../ast/get-used-globals');
/**
 * @param {Object} loaderContext
 * @param {nunjucks.nodes.Root} nodes
 * @param {InstancesList} extensions
 * @param {InstancesList} filters
 * @param {InstancesList} globals
 * @param {Object} loaderOptions
 * @returns {Promise<Object>}
 */
async function getUsedDependencies(loaderContext, nodes, extensions, filters, globals, loaderOptions) {
  const { webpackAlias = {} } = loaderOptions;
  const resourcePath = loaderContext.resourcePath;
  const templateContext = (0, _pathe.dirname)(resourcePath);
  const templates = await (0, _getTemplatesImports.getTemplatesImports)(
    loaderContext,
    nodes,
    templateContext,
    webpackAlias,
  );
  return {
    templates,
    globals: (0, _getUsedGlobals.getUsedGlobals)(nodes, globals),
    extensions: (0, _getUsedExtensions.getUsedExtensions)(nodes, extensions),
    filters: (0, _getUsedFilters.getUsedFilters)(nodes, filters),
  };
}
