import { ERROR_MODULE_NOT_FOUND } from './lib/constants';
import { doTransform } from './lib/do-transform';
import { getLoaderOptions } from './lib/get-loader-options';

function getImportPath(resourcePath) {
  return resourcePath;
}

export default function nunjucksLoader(source) {
  const callback = this.async();
  const options = getLoaderOptions(this, callback);

  if (options === null) {
    return;
  }

  const resourcePathImport = getImportPath(this.resourcePath);

  doTransform(source, this, {
    resourcePathImport,
    options,
  }).then(
    (result) => {
      callback(null, result);
    },
    (error) => {
      if (error.code === ERROR_MODULE_NOT_FOUND && error.message.includes("'glob'")) {
        return callback(new Error('Attempt to use dynamic assets ' + 'without optional "glob" dependency installed'));
      }

      callback(error);
    },
  );
}
