/// <reference path="../node_modules/monaco-editor/monaco.d.ts" />

import * as ts from 'typescript';
import debounce = require('lodash.debounce');

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

function bootstrap() {
  const win = window as any;
  win.require.config({ paths: { vs: '/* @echo MONACO_LOCATION */' } });

  (window as any).MonacoEnvironment = {
		getWorkerUrl: (workerId, label) => {
			return 'proxy.js';
		}
	};

  win.require(['/* @echo MONACO_ENTRY */'], init);
}

function init() {
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

  monaco.languages.typescript.getTypeScriptWorker()
    .then(worker => worker(tsEditor.getModel().uri))
    .then(worker => service = worker)
    .then(ready);
}

function ready() {
  tsEditor.onDidChangeModelContent(debounce(onCodeChange, 100));
  _runCode.onclick = runCode;
  fadeOut(_loading);
}

function getOptions() {
  return JSON.parse(JSON.stringify((window as any).compilerOptions));
}

function onCodeChange(event: monaco.editor.IModelContentChangedEvent) {
  service.getEmitOutput(tsEditor.getModel().uri.toString())
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
      if (text !== undefined) {
        updateJsEditor(text);
      }
    });
}

function updateJsEditor(text: string) {
  jsEditor.getModel().setValue(text);
}

function updateCompilerOptions() {
  const options = getOptions();
  options.allowNonTsExtensions = true;
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
}

function setDefaultOptions() {
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

function updateEditorOptions() {

}

function clearConsole() {
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

function logToText(message: any) {
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

function fadeOut(target: HTMLElement) {
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

function showProcessingIndicator() {
  _processing.style.display = 'inline-block';
}

function hideProcessingIndicator() {
  _processing.style.display = 'none';
}

function runCode() {
  setTimeout(() => {

  }, 100);
}

bootstrap();
