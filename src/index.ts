/// <reference path="./typings.d.ts" />

import * as ts from 'typescript';
import debounce = require('lodash.debounce');
import runWindowHtml = require('./run.html');

const runWindowCode = runWindowHtml
  .replace(new RegExp(/__BASE__/), window.location.href)
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
const _consoleContent = document.getElementById('console-content');

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
  updateEditorOptions();
  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: [].join('\n'),
    language: 'typescript',
    automaticLayout: true,
    minimap: {
      enabled: false
    },
    selectionClipboard: false
  });

  jsEditor = monaco.editor.create(_editorJs, {
    value: [].join('\n'),
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
  _runCode.onclick = runCode;
  fadeOut(_loading);
}

function getOptions(): monaco.languages.typescript.CompilerOptions {
  return JSON.parse(JSON.stringify((window as any).compilerOptions));
}

function getService(): monaco.Promise<any> {
  return monaco.languages.typescript.getTypeScriptWorker()
    .then(worker => worker(tsEditor.getModel().uri))
}

function onCodeChange(event: monaco.editor.IModelContentChangedEvent): void {
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
    experimentalDecorators: true,
    emitDecoratorMetadata: false,
    allowNonTsExtensions: true,
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    module: monaco.languages.typescript.ModuleKind.ES2015
  };

  (window as any).compilerOptions = defaultOptions;
}

function updateEditorOptions(): void {

}

function clearConsole(): void {
  _consoleContent.innerHTML = '';
}

function updateConsole(type: string, message: any, ...optionalParams: any[]): void {
  let text = logToText(message);

  for (let param of optionalParams) {
    text += `\n   ${logToText(param)}`;
  }

  text = wrapConsoleText(type, text);

  _consoleContent.innerHTML += `${text}\n`;
}

function logToText(message: any): string {
  if (typeof message === 'object' && message !== null) {
    return JSON.stringify(message);
  }

  return `${escape(message)}`;
}

function wrapConsoleText(type: string, text: string): string {
  return `<span class="log-${type}"><span class="icon-${type}"></span>${text}</span>`;
}

function escape(text: string): string {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
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

function find<T>(input: T[], test: (element: T) => boolean): T {
  if (!Array.isArray(input)) {
    return null;
  }

  for (let el of input) {
    if (test(el)) {
      return el;
    }
  }

  return null;
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

bootstrap();
