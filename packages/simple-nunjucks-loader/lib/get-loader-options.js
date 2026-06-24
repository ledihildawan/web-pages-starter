Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getLoaderOptions = getLoaderOptions;
var _schema = _interopRequireDefault(require('./schema.json'));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function getLoaderOptions(loader, callback) {
  let loaderOptions;
  try {
    loaderOptions = loader.getOptions(_schema.default);
  } catch (e) {
    callback(e);
    return null;
  }
  for (const key in _schema.default.properties) {
    if (!Object.hasOwn(_schema.default.properties, key) || key in loaderOptions) {
      continue;
    }
    const schemaProp = _schema.default.properties[key];
    if (!('default' in schemaProp)) {
      continue;
    }
    loaderOptions[key] = schemaProp['default'];
  }
  return loaderOptions;
}
