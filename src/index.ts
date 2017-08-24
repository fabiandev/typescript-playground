import * as ts from 'typescript';
import debounce = require('lodash.debounce');
import runWindowHtml = require('./run.html');

const runWindowCode = runWindowHtml
  .replace(new RegExp(/__BASE__/), window.location.href.replace(/\/?$/, '/'))
  .replace(new RegExp(/__VERSION__/g), '/* @echo VERSION */');

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;
let runWindow: Window;

const _editorJs = document.getElementById('editor-js');
const _editorTs = document.getElementById('editor-ts');
const _runCode = document.getElementById('run-code');
const _runText = document.getElementById('run-text')
const _loading = document.getElementById('loading');
const _processing = document.getElementById('processing');
const _optionsToggle = document.getElementById('options-toggle');
const _options = document.getElementById('options');

let defaultOptions: monaco.languages.typescript.CompilerOptions;
(window as any).tsp = {};

function setDefaultOptions(): void {
  defaultOptions = {
    noImplicitAny: false,
    strictNullChecks: false,
    noImplicitReturns: false,
    noImplicitThis: false,
    removeComments: false,
    experimentalDecorators: false,
    emitDecoratorMetadata: false,
    allowNonTsExtensions: true,
    target: monaco.languages.typescript.ScriptTarget.ES5
  };
}

function bootstrap(): void {
  const win = window as any;
  win.require.config({ paths: { vs: '/* @echo MONACO_LOCATION */' } });

  (window as any).MonacoEnvironment = {
    getWorkerUrl: (workerId, label) => {
      return 'proxy.js';
    }
  };

  win.require(['/* @echo MONACO_ENTRY */'], init);
}

function init(): void {
  setDefaultOptions();
  expose();
  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: [
      'console.info(\'typescript-playground v/* @echo VERSION */\');',
      '',
      'function foo(bar: number): string {',
      '    return `${bar}`;',
      '}',
      ''
    ].join('\n'),
    language: 'typescript',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    selectionClipboard: false
  });

  jsEditor = monaco.editor.create(_editorJs, {
    value: [
      '',
      ''
    ].join('\n'),
    language: 'javascript',
    readOnly: true,
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    // contextmenu: false,
    quickSuggestions: false,
    parameterHints: false,
    autoClosingBrackets: false,
    suggestOnTriggerCharacters: false,
    snippetSuggestions: 'none',
    wordBasedSuggestions: false,
    // selectionClipboard: false,
    // find: {
    //   seedSearchStringFromSelection: false,
    //   autoFindInSelection: false
    // }
  });

  ready();
}

function ready(): void {
  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 100));
  _optionsToggle.onclick = toggleOptions;
  _runCode.onclick = runCode;
  initOptions();
  window.onkeydown = keyBindings;
  onCodeChange();
  fadeOut(_loading);
}

function expose() {
  (window as any).tsp.compilerOptions = defaultOptions;
  (window as any).tsp.compile = onCodeChange;
  (window as any).tsp.emit = onCodeChange;
  (window as any).tsp.run = () => runCode();

  (window as any).tsp.sync = () => {
    initOptions();
    updateCompilerOptions();
  };

  (window as any).tsp.setCompilerOption = (name: string, value: any) => {
    (window as any).tsp.compilerOptions[name] = value;
    initOptions();
    updateCompilerOptions();
    onCodeChange();
  };
}

function initOptions() {
  const inputs = document
    .getElementById('options')
    .getElementsByClassName('compilerOption') as
    NodeListOf<HTMLInputElement | HTMLSelectElement>;

  for (let i = 0; i < inputs.length; i++) {
    if ((window as any).tsp.compilerOptions.hasOwnProperty(inputs[i].name)) {
      if (inputs[i] instanceof HTMLInputElement) {
        if ((inputs[i] as HTMLInputElement).type === 'checkbox') {
          (inputs[i] as HTMLInputElement).checked = !!defaultOptions[inputs[i].name];
        } else if((inputs[i] as HTMLInputElement).type === 'text') {
          (inputs[i] as HTMLInputElement).value = `${defaultOptions[inputs[i].name]}`;
        }
      } else if (inputs[i] instanceof HTMLSelectElement) {
        (inputs[i] as HTMLSelectElement).value = `${defaultOptions[inputs[i].name]}`;
      }
    }

    inputs[i].onchange = onOptionChange;
  }
}

function keyBindings(this: Window, ev: KeyboardEvent) {
  if (ev.ctrlKey && ev.which === 82 /* r */) {
    runCode();
  }

  if ((ev.ctrlKey || ev.metaKey) && ev.which === 83 /* s */) {
    ev.preventDefault();
  }
}

function onOptionChange(this: HTMLInputElement | HTMLSelectElement, ev: Event): any {
  let value = (window as any).tsp.compilerOptions[this.name];

  if (this instanceof HTMLInputElement) {
    if ((this as HTMLInputElement).type === 'checkbox') {
      value = !!(this as HTMLInputElement).checked;
    } else if((this as HTMLInputElement).type === 'text') {
      value = (this as HTMLInputElement).value;
    }
  } else if (this instanceof HTMLSelectElement) {
    value = (this as HTMLSelectElement).value;
  } else {
    value = this.value;
  }

  (window as any).tsp.compilerOptions[this.name] = value;

  updateCompilerOptions();
  onCodeChange();
}

function onCodeChange(event?: monaco.editor.IModelContentChangedEvent): void {
  showProcessingIndicator();

  getService()
    .then(service => {
      return service.getEmitOutput(tsEditor.getModel().uri.toString())
    })
    .then((result: ts.EmitOutput) => {
      if (result.emitSkipped) {
        return false;
      }

      if (!result.outputFiles || !result.outputFiles[0]) {
        return false;
      }

      return result.outputFiles[0].text;
    })
    .then(text => {
      if (typeof text === 'string') {
        updateJsEditor(text);
      }

      return !!text;
    })
    .then(updated => {
      hideProcessingIndicator();
    });
}

function runCode(): void {
  let win: Window;

  if (!runWindow || runWindow.closed) {
    windowOpened();
    win = window.open('', '', 'width=800,height=600');
    runWindow = win;
  } else {
    win = runWindow;
    windowRefreshed();
  }

  win.document.open()
  win.document.write(getWindowCode());
  win.document.close();
  win.onunload = windowUnloaded;
}

function windowOpened() {
  _runText.innerText = 'Run in window';
}

function windowRefreshed() {
  _runText.innerText = 'Run in window';
}

function windowUnloaded() {
  _runText.innerText = 'Run in new window';
}

function updateJsEditor(text: string): void {
  jsEditor.getModel().setValue(text);
}

function updateCompilerOptions(): void {
  const options = getOptions();
  options.allowNonTsExtensions = true;
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
}

function getWindowCode(): string {
  return runWindowCode.replace(/__CODE__/, jsEditor.getValue())
}

function getOptions(): monaco.languages.typescript.CompilerOptions {
  return JSON.parse(JSON.stringify((window as any).tsp.compilerOptions));
}

function getService(): monaco.Promise<any> {
  return monaco.languages.typescript.getTypeScriptWorker()
    .then(worker => worker(tsEditor.getModel().uri))
}

function toggleOptions(this: HTMLElement, ev: Event): void {
  this.classList.toggle('active');
  _options.classList.toggle('visible');
}

function showProcessingIndicator(): void {
  _processing.style.display = 'inline-block';
}

function hideProcessingIndicator(): void {
  _processing.style.display = 'none';
}

function fadeOut(target: HTMLElement, interval = 5, reduce = 0.01): void {
  target.style.opacity = '1';

  const fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = `${parseFloat(target.style.opacity) - reduce}`;
    }
  }, interval);
}

bootstrap();
