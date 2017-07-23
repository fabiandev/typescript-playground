const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const config = {};

config.version = pkg.version;

config.paths = {
  src: 'src',
  dest: 'docs'
};

config.monaco = {
  version: pkg.devDependencies['monaco-editor'],
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
    declaration: false,
    module: "commonjs",
    target: "ES5",
    noEmit: false,
    declaration: false
  }
};

config.webpack = {
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
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({sourceMap: true})
  ]
};

config.replace = {
  VERSION: config.version,
  BUNDLE_NAME: config.webpack.output.filename,
  MONACO_VERSION: config.monaco.version,
  MONACO_ENTRY: config.monaco.entry,
  MONACO_BASE: config.monaco.base,
  MONACO_LOCATION: config.monaco.location,
  MONACO_LOADER: config.monaco.loader
};

module.exports = config;
