const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8080,
      hot: true
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        title: 'RTS Game'
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'assets', 
            to: 'assets',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          phaser: {
            test: /[\\/]node_modules[\\/]phaser[\\/]/,
            name: 'phaser',
            chunks: 'all',
          }
        }
      }
    }
  };
};