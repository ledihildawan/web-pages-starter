module.exports = (num, x, y, kwargs, callback) => {
  setTimeout(() => {
    const cb = typeof kwargs === 'function' ? kwargs : callback;
    cb(null, num + ((kwargs && kwargs.bar) || 10));
  }, 1000);
};

module.exports.async = true;
