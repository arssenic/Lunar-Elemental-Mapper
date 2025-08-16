const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
};
