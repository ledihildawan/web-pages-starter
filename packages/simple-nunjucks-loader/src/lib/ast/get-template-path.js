import nunjucks from 'nunjucks';

import { ImportWrapper } from '../import-wrapper/ImportWrapper';

import { getAddNodeValue } from './get-add-node-value';

/**
 * @param {nunjucks.Node} node
 * @returns {ImportWrapper}
 */
export function getTemplatePath(node) {
  const template = node.template;

  if (template instanceof nunjucks.nodes.Add) {
    return getAddNodeValue(template);
  }

  const value = new ImportWrapper();

  if (template instanceof nunjucks.nodes.Symbol) {
    return value.addSymbol(template.value);
  }

  return value.addLiteral(template.value);
}
