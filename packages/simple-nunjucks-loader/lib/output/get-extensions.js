Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getExtensions = getExtensions;
function getExtensions(extensions) {
  function imports() {
    return extensions
      .map(({ importStatement, dependencyInject }) => {
        return `
            ${importStatement}
            ${dependencyInject}`;
      })
      .join('');
  }
  return {
    imports,
  };
}
