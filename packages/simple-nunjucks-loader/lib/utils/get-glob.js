Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getGlob = getGlob;
var _util = require('util');
var _getModule = require('../../public/utils/get-module');
function _interopRequireWildcard(e, t) {
  if ('function' == typeof WeakMap)
    var r = new WeakMap(),
      n = new WeakMap();
  return (_interopRequireWildcard = (e, t) => {
    if (!t && e && e.__esModule) return e;
    var o,
      i,
      f = { __proto__: null, default: e };
    if (null === e || ('object' != typeof e && 'function' != typeof e)) return f;
    if ((o = t ? n : r)) {
      if (o.has(e)) return o.get(e);
      o.set(e, f);
    }
    for (const t in e)
      'default' !== t &&
        Object.hasOwn(e, t) &&
        ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set)
          ? o(f, t, i)
          : (f[t] = e[t]));
    return f;
  })(e, t);
}
async function getGlob() {
  const glob = await Promise.resolve().then(() => _interopRequireWildcard(require('glob')));
  const globModule = (0, _getModule.getModule)(glob);
  return (0, _util.promisify)(globModule);
}
