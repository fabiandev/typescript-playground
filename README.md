# TypeScript Playground

A playground for TypeScript with the [Monaco Editor](https://github.com/Microsoft/monaco-editor).

## Try

See the playground in action: https://fabiandev.github.io/typescript-playground

## Compiler Options

The playground supports some compiler options out of the box. Anyway, a property `tsp` is exposed to the global `window` object, where it is possible to set any option not supported by the UI:

```js
tsp.compilerOptions.removeComments = true;
tsp.sync(); // Sync options with the editor
tsp.compile(); // Compile TypeScript code
tsp.run(); // Run target code in new window
```

## Development Setup

If you want to contribute to this project, it is easy to set it up on your system.

### Installation

Simply clone the repository and install its dependencies.

```sh
$ git clone https://github.com/fabiandev/typescript-playground.git
$ cd typescript-playground
$ yarn
```

> You may also use `npm install` instead of `yarn`

### Configuration

You can set the configuration for the build in `config.js`:

|   Option   |                        Description                          |
|------------|-------------------------------------------------------------|
| paths      | The relative source and destination paths                   |
| monaco     | Location of the editor                                      |
| typescript | Options for building TypeScript files                       |
| webpack    | The settings for bundling the app                           |
| replace    | Data for preprocess, applied to all files other than assets |

### Build

To start a build, run `yarn build`.

> `npm run build` is also a possible command.

### Watch

To run tasks while developing, use `yarn watch`.

### Serve

With `yarn serve` a dev server with live reload can be started, to preview the project locally.

## Credits

- [Monaco Editor](https://github.com/Microsoft/monaco-editor)
- [normalize.css](https://github.com/necolas/normalize.css)
- [lodash.debounce](https://github.com/lodash/lodash)

## License

[MIT](https://github.com/fabiandev/typescript-playground/blob/master/LICENSE)
