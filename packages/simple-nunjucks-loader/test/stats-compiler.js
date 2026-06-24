import path from 'path';

import { nanoid } from 'nanoid';
import webpack from 'webpack';

export function statsCompiler(fixture, options = {}, webpackConfig = {}) {
  const bundleName = nanoid();

  const compiler = webpack({
    mode: 'development',
    devtool: false,
    target: 'node',
    context: __dirname,
    entry: `./${fixture}`,
    output: {
      libraryTarget: 'commonjs2',
      path: path.join(__dirname, 'bundles'),
      filename: `${bundleName}.js`,
      assetModuleFilename: 'bundles/[path][name][ext]',
    },
    module: {
      rules: [
        {
          test: /\.njk$/,
          use: {
            loader: path.resolve(__dirname, '../src/index.js'),
            options: options,
          },
        },
        {
          test: /\.(css|txt|md)$/,
          type: 'asset/resource',
        },
      ],
    },
    resolve: webpackConfig.resolve,
    ...webpackConfig,
  });

  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }

      resolve({
        bundleName,
        stats,
      });
    });
  });
}
