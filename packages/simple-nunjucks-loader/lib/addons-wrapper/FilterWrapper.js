Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.FilterWrapper = void 0;
var _AddonWrapper = require('./AddonWrapper');
class FilterWrapper extends _AddonWrapper.AddonWrapper {
  constructor(options) {
    super({
      ...options,
      type: 'filters',
    });
  }
  get dependencyInject() {
    const inject = super.dependencyInject;
    return Promise.resolve(this.instance).then((instance) =>
      inject.replace(
        /\n\s*\};$/,
        `,
              async: ${JSON.stringify(instance.async === true)}
            };`,
      ),
    );
  }
}
exports.FilterWrapper = FilterWrapper;
