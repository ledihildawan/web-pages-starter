import { stringifyRequest } from 'loader-utils';

import { stringify } from '../import-wrapper/stringify';
import { getImportStr } from '../utils/get-import-str';

export function getDynamicImport(loaderContext, assetPath, assetImport, { esModule, importVar } = {}) {
  const args = assetImport.toArgs();
  const isDynamicImport = assetImport.isDynamic();

  let importPath;
  if (isDynamicImport) {
    importPath = stringify(loaderContext, assetImport).toString();
  } else {
    const rawPath = assetImport.toString();
    const lastBangIndex = rawPath.lastIndexOf('!');
    if (lastBangIndex > 0) {
      const loaderPrefix = rawPath.substring(0, lastBangIndex + 1);
      const filePath = rawPath.substring(lastBangIndex + 1);
      importPath = loaderPrefix + stringifyRequest(loaderContext, filePath);
    } else {
      importPath = stringifyRequest(loaderContext, rawPath);
    }
  }

  return isDynamicImport
    ? `const ${importVar} = function(${args.join()}) {
            return ${getImportStr(importPath, esModule, true)()}
        };`
    : `${getImportStr(importPath, esModule)(importVar)}`;
}
