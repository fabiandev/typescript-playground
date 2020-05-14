const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const pkg = require('./package.json');

const config = {};

config.version = pkg.version;

config.paths = {
  src: 'src',
  dest: 'docs'
};

config.typescript = {
  compilerOptions: {
    sourceMap: true,
    rootDir: 'src',    
    module: "commonjs",
    target: "ES5",
    noEmit: false,
    declaration: false,
  }
};

config.webpack = {
  mode: process.env.NODE_ENV || 'production',
  entry: {
    bundle: path.join(__dirname, `${config.paths.src}/index.ts`)
  },
  output: {
    filename: 'app.js',
    path: path.join(__dirname, config.paths.dest)
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.tsx?$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.tsx?$/,
        exclude: /(node_modules|(\.d\.ts$))/,
        loader: 'ts-loader',
        options: config.typescript
      }, {
        test: /\.html$/,
        use: 'raw-loader'
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        sourceMap: true
      })
    ]
  }
};

config.replace = {
  VERSION: config.version,
  BUNDLE_NAME: config.webpack.output.filename
};

module.exports = config;
