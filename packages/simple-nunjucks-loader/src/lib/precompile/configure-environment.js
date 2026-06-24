import nunjucks from 'nunjucks';

import { addonsLoader } from '../addons-wrapper/addons-loader';

function configure(opts) {
  return new nunjucks.Environment(null, opts);
}

/**
 * @param {Object}   env
 * @param {Object}   env.options
 * @param {Array}    env.extensions
 * @param {Array}    env.filters
 * @returns {nunjucks.Environment}
 */
export async function configureEnvironment({ options, extensions = [], filters = [] } = {}) {
  const env = configure(options);

  await Promise.all([addonsLoader(extensions), addonsLoader(filters)]);
  extensions.forEach(({ name, instance }) => {
    env.addExtension(name, instance);
  });

  filters.forEach(({ name, instance }) => {
    env.addFilter(name, instance, instance.async === true);
  });

  return env;
}
