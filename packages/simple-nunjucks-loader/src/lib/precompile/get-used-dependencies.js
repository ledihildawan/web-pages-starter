import { dirname } from 'pathe';

import { getTemplatesImports } from '../ast/get-templates-imports';
import { getUsedExtensions } from '../ast/get-used-extensions';
import { getUsedFilters } from '../ast/get-used-filters';
import { getUsedGlobals } from '../ast/get-used-globals';

/**
 * @param {Object} loaderContext
 * @param {nunjucks.nodes.Root} nodes
 * @param {InstancesList} extensions
 * @param {InstancesList} filters
 * @param {InstancesList} globals
 * @param {Object} loaderOptions
 * @returns {Promise<Object>}
 */
export async function getUsedDependencies(loaderContext, nodes, extensions, filters, globals, loaderOptions) {
  const { webpackAlias = {} } = loaderOptions;

  const resourcePath = loaderContext.resourcePath;
  const templateContext = dirname(resourcePath);

  const templates = await getTemplatesImports(loaderContext, nodes, templateContext, webpackAlias);

  return {
    templates,
    globals: getUsedGlobals(nodes, globals),
    extensions: getUsedExtensions(nodes, extensions),
    filters: getUsedFilters(nodes, filters),
  };
}
