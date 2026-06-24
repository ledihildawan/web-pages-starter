import { resolve as patheResolve, normalize as patheNormalize } from 'pathe';

import { ImportLiteral } from './ImportLiteral';
import { ImportSymbol } from './ImportSymbol';
import { normalizeTrailingSlash } from './normalize-trailing-slash';

/**
 * Joins template import with another path
 *
 * @param {string} prependPath
 * @param {ImportWrapper} templateImport
 */
export function resolve(prependPath, templateImport) {
  const _templateImport = templateImport.concat();
  let firstPart = _templateImport.shift();
  if (firstPart instanceof ImportSymbol) {
    _templateImport.unshift(firstPart);
    firstPart = '';
  }

  const resolvedPath = patheResolve(prependPath, firstPart.valueOf());
  const normalizedPath = patheNormalize(resolvedPath);
  const filePath = normalizeTrailingSlash(normalizedPath, firstPart);

  _templateImport.unshift(new ImportLiteral(filePath));

  return _templateImport;
}
