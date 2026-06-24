Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.configureEnvironment = configureEnvironment;
var _nunjucks = _interopRequireDefault(require('nunjucks'));
var _addonsLoader = require('../addons-wrapper/addons-loader');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function configure(opts) {
  return new _nunjucks.default.Environment(null, opts);
}

/**
 * @param {Object}   env
 * @param {Object}   env.options
 * @param {Array}    env.extensions
 * @param {Array}    env.filters
 * @returns {nunjucks.Environment}
 */
async function configureEnvironment({ options, extensions = [], filters = [] } = {}) {
  const env = configure(options);
  await Promise.all([(0, _addonsLoader.addonsLoader)(extensions), (0, _addonsLoader.addonsLoader)(filters)]);
  extensions.forEach(({ name, instance }) => {
    env.addExtension(name, instance);
  });
  filters.forEach(({ name, instance }) => {
    env.addFilter(name, instance, instance.async === true);
  });
  return env;
}
