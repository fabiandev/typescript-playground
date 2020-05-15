<p align="center">
  <img width="100%" src="playground.png?v=1">
</p>
<p align="center">
  <a href="https://fabiandev.github.io/typescript-playground">Click here</a> to play
</p>

# TypeScript Playground

A playground for TypeScript with the [Monaco Editor](https://github.com/Microsoft/monaco-editor).

## Play

See the playground in action: https://fabiandev.github.io/typescript-playground

> A shareable URL can be obtained from the settings of the editor.

## Compiler Options

The playground supports some compiler options out of the box. Anyway, a property `tsp` is exposed to the global `window` object, where it is possible to set any option not supported by the UI:

```js
tsp.setCompilerOption('emitDecoratorMetadata', true);
```

## Console API

The editor exposes some more functionality:

| Property                             | Description
|--------------------------------------|--------------------------------------------------
| options                              | Holds all options of the editor, including compiler options
| sync()                               | Syncs (changed) options with the editor
| emit()                               | Triggers a compilation
| run()                                | Runs the compiled code in a window
| share()                              | Retrieves a shareable URL as string
| reset(reload = false, force = false) | Resets the editor and optionally reloads the page
| setCompilerOption(option, value)     | Set any compiler option programatically
| changeTsVersion(version)             | Reloads page with ?ts=version query string

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
| replace    | Data for [preprocess](https://github.com/jsoverson/preprocess), applied to all files other than assets |

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
