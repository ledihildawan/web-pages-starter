module.exports = (api) => {
  const isESM = api.env('esm');

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: '3',
          modules: isESM ? false : 'auto',
          targets: {
            node: '16.0.0',
          },
        },
      ],
    ],
  };
};
