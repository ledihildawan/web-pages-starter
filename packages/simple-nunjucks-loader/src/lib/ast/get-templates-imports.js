import nunjucks from 'nunjucks';

import { getFirstExistedPath } from '../utils/get-first-existed-path';
import { getPossiblePaths } from '../utils/get-possible-paths';
import { isUniqueAsset } from '../utils/is-unique-asset';

import { getNodesValues } from './get-nodes-values';
import { getTemplatePath } from './get-template-path';

/**
 * Find first existed path
 *
 * @param {string} path
 * @param {ImportWrapper[]} paths
 * @returns {Promise<string[]>}
 */
async function filterPaths([path, paths]) {
  try {
    const importPath = await getFirstExistedPath(paths);
    return [path, importPath];
  } catch {
    throw new Error(`Template "${path}" not found`);
  }
}

const nodeTypes = [nunjucks.nodes.Extends, nunjucks.nodes.Include, nunjucks.nodes.Import, nunjucks.nodes.FromImport];

/**
 * @param {Object} loaderContext
 * @param {nunjucks.nodes.Root} nodes
 * @param {string}            templateContext
 * @param {Object}             [webpackAlias]
 * @returns {Promise<[ImportWrapper, ImportWrapper][]>}
 */
export function getTemplatesImports(loaderContext, nodes, templateContext, webpackAlias = {}) {
  const templateDeps = getNodesValues(nodes, nodeTypes, getTemplatePath).filter(isUniqueAsset);
  const possiblePaths = getPossiblePaths(templateDeps, templateContext, webpackAlias);
  const resolvedTemplates = possiblePaths.map(filterPaths);

  return Promise.all(resolvedTemplates);
}
