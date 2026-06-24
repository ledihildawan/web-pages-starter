Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.AddonWrapper = void 0;
var _loaderUtils = require('loader-utils');
var _getModule = require('../../public/utils/get-module');
var _constants = require('../constants');
var _getModuleOutput = require('../output/get-module-output');
var _getImportStr = require('../utils/get-import-str');
var _toVar = require('../utils/to-var');
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
class AddonWrapper {
  #name = null;
  #importPath = null;
  #instance = null;
  #type = null;
  #loaderContext = null;
  #es = false;
  constructor({ name, importPath, type, es, loaderContext }) {
    if (typeof name !== 'string') {
      throw new TypeError('AddonWrapper: name should be a string');
    }
    this.#name = name;
    if (!importPath) {
      throw new TypeError('AddonWrapper: import path required');
    }
    this.#importPath = importPath;
    if (typeof type !== 'string') {
      throw new TypeError('AddonWrapper: addon type required');
    }
    this.#type = type;
    this.#loaderContext = loaderContext;
    if (typeof es !== 'boolean') {
      throw new TypeError('AddonWrapper: es type should be a boolean');
    }
    this.#es = es === true;
  }
  get name() {
    return this.#name;
  }
  get instance() {
    if (this.#instance !== null) {
      return this.#instance;
    }
    return new Promise((resolve, reject) => {
      ((specifier) => new Promise((r) => r(`${specifier}`)).then((s) => _interopRequireWildcard(require(s))))(
        this.#importPath,
      )
        .then((instance) => (0, _getModule.getModule)(instance))
        .then((_instance) => {
          this.#instance = _instance;
          return _instance;
        })
        .then(resolve)
        .catch(reject);
    });
  }
  get importVar() {
    return (0, _toVar.toVar)(`${_constants.IMPORTS_PREFIX}_${this.#type}_${this.#name}`);
  }
  get importStatement() {
    return (0, _getImportStr.getImportStr)(
      (0, _loaderUtils.stringifyRequest)(this.#loaderContext, this.#importPath),
      this.#es,
    )(this.importVar);
  }
  get dependencyInject() {
    return `${_constants.TEMPLATE_DEPENDENCIES}.${this.#type}['${this.#name}'] = {
            module: ${(0, _getModuleOutput.getModuleOutput)(this.importVar)}
        };`;
  }
}
exports.AddonWrapper = AddonWrapper;
