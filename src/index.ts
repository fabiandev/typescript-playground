/// <reference path="./typings.d.ts" />

import * as ts from 'typescript';
import debounce = require('lodash.debounce');
import runWindowHtml = require('./run.html');

const runWindowCode = runWindowHtml
  .replace(new RegExp(/__BASE__/), window.location.href.replace(/\/?$/, '/'))
  .replace(new RegExp(/__VERSION__/g), '/* @echo VERSION */');

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;
let runWindow: Window;
let service: any;

const _editorJs = document.getElementById('editor-js');
const _editorTs = document.getElementById('editor-ts');
const _runCode = document.getElementById('run-code');
const _loading = document.getElementById('loading');
const _processing = document.getElementById('processing');
const _optionsToggle = document.getElementById('options-toggle');
const _options = document.getElementById('options');

let defaultOptions: monaco.languages.typescript.CompilerOptions;

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
  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: [
      'let foo: string = "Hello World!";',
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
    contextmenu: false,
    quickSuggestions: false,
    parameterHints: false,
    autoClosingBrackets: false,
    suggestOnTriggerCharacters: false,
    snippetSuggestions: 'none',
    wordBasedSuggestions: false,
    selectionClipboard: false,
    find: {
      seedSearchStringFromSelection: false,
      autoFindInSelection: false
    }
  });

  ready();
}

function ready(): void {
  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 100));
  _optionsToggle.onclick = toggleOptions;
  _runCode.onclick = runCode;
  initOptions();
  onCodeChange();
  fadeOut(_loading);
}

function initOptions() {
  const inputs = document
    .getElementById('options')
    .getElementsByClassName('compilerOption') as
    NodeListOf<HTMLInputElement | HTMLSelectElement>;

  for (let i = 0; i < inputs.length; i++) {
    if (defaultOptions.hasOwnProperty(inputs[i].name)) {
      if (inputs[i] instanceof HTMLInputElement) {
        (inputs[i] as HTMLInputElement).checked = !!defaultOptions[inputs[i].name];
      } else if(inputs[i] instanceof HTMLSelectElement) {
        (inputs[i] as HTMLSelectElement).value = `${defaultOptions[inputs[i].name]}`;
      }
    }

    inputs[i].onchange = onOptionChange;
  }
}

function onOptionChange(this: HTMLInputElement | HTMLSelectElement, ev: Event): any {
  let value;

  if (this instanceof HTMLInputElement) {
    value = !!(this as HTMLInputElement).checked;
  } else if (this instanceof HTMLSelectElement) {
    value = (this as HTMLSelectElement).value;
  } else {
    value = this.value;
  }

  (window as any).compilerOptions[this.name] = value;

  updateCompilerOptions();
  onCodeChange();
}

function getOptions(): monaco.languages.typescript.CompilerOptions {
  return JSON.parse(JSON.stringify((window as any).compilerOptions));
}

function getService(): monaco.Promise<any> {
  return monaco.languages.typescript.getTypeScriptWorker()
    .then(worker => worker(tsEditor.getModel().uri))
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
      if (text) {
        updateJsEditor(text);
        hideProcessingIndicator();
      }
    });
}

function updateJsEditor(text: string): void {
  jsEditor.getModel().setValue(text);
}

function updateCompilerOptions(): void {
  const options = getOptions();
  options.allowNonTsExtensions = true;
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
}

function setDefaultOptions(): void {
  defaultOptions = {
    noImplicitAny: false,
    strictNullChecks: false,
    noImplicitReturns: false,
    noImplicitThis: false,
    removeComments: false,
    experimentalDecorators: true,
    emitDecoratorMetadata: false,
    allowNonTsExtensions: true,
    target: monaco.languages.typescript.ScriptTarget.ES5
  };

  (window as any).compilerOptions = defaultOptions;
}

function fadeOut(target: HTMLElement): void {
  target.style.opacity = '1';

  const fadeEffect = setInterval(() => {
    if (parseFloat(target.style.opacity) < 0.05) {
      clearInterval(fadeEffect);
      target.style.opacity = '0';
      target.style.display = 'none';
    } else {
      target.style.opacity = `${parseFloat(target.style.opacity) - 0.01}`;
    }
  }, 5);
}

function showProcessingIndicator(): void {
  _processing.style.display = 'inline-block';
}

function hideProcessingIndicator(): void {
  _processing.style.display = 'none';
}

function getWindowCode(): string {
  return runWindowCode.replace(/__CODE__/, jsEditor.getValue())
}

function runCode(): void {
  let win: Window;

  if (!runWindow || runWindow.closed) {
    win = window.open('', '', 'width=800,height=600');
    runWindow = win;
  } else {
    win = runWindow;
  }

  win.document.open()
  win.document.write(getWindowCode());
  win.document.close();
}

function toggleOptions(): void {
  _options.classList.toggle('visible');
}

bootstrap();
