const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const pkg = require('./package.json');
const monacoEditorPkg = require('monaco-typescript/package.json');

const config = {};

config.version = pkg.version;

config.paths = {
  src: 'src',
  dest: 'docs'
};

config.monaco = {
  version: pkg.devDependencies['monaco-editor'],
  typescriptVersion: monacoEditorPkg.devDependencies.typescript,
  entry: 'vs/editor/editor.main',
  get base() {
    return `https://unpkg.com/monaco-editor@${this.version}/min`;
  },
  get location() {
    return `https://unpkg.com/monaco-editor@${this.version}/min/vs`
  },
  get loader() {
    return `${this.location}/loader.js`
  }
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
        test: /\.html/,
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
  TYPESCRIPT_VERSION: config.monaco.typescriptVersion,
  BUNDLE_NAME: config.webpack.output.filename,
  MONACO_VERSION: config.monaco.version,
  MONACO_ENTRY: config.monaco.entry,
  MONACO_BASE: config.monaco.base,
  MONACO_LOCATION: config.monaco.location,
  MONACO_LOADER: config.monaco.loader
};

module.exports = config;
