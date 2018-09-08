import * as ts from 'typescript';
import debounce = require('lodash.debounce');
import runWindowHtmlConsole = require('./run-console.html');
import runWindowHtmlPlain = require('./run-plain.html');

declare global {
    interface Window {
      tsp: {
        options?: Options;
        compile?: typeof onCodeChange;
        emit?: typeof onCodeChange;
        run?: typeof runCode;
        share?: typeof getShareableUrl;
        reset?: typeof resetLocalStorage;
        sync?: typeof syncOptions;
        setCompilerOption?: typeof setCompilerOption;
      }
    }
}

interface Options {
  compilerOptions?: monaco.languages.typescript.CompilerOptions;
  windowOptions?: WindowOptions;
  uiOptions?: UIOptions;
}

interface UIOptions {
  autoUpdateUrl?: boolean;
  localStorageBackup?: boolean;
}

interface WindowOptions {
  console?: boolean
}

interface HashValue {
  editor?: string;
  options?: Options;
}

let tsEditor: monaco.editor.IStandaloneCodeEditor;
let jsEditor: monaco.editor.IStandaloneCodeEditor;
let runWindow: Window;

const runWindowCodeConsole = prepareWindowCode(runWindowHtmlConsole);
const runWindowCodePlain = prepareWindowCode(runWindowHtmlPlain);

const _tsVersion = document.getElementById('ts-version');
const _editorJs = document.getElementById('editor-js');
const _editorTs = document.getElementById('editor-ts');
const _runCode = document.getElementById('run-code');
const _runText = document.getElementById('run-text')
const _loading = document.getElementById('loading');
const _processing = document.getElementById('processing');
const _shareableUrl = document.getElementById('shareable-url');
const _optionsToggle = document.getElementById('options-toggle');
const _options = document.getElementById('options');
const _optionsList = (Array.prototype.slice.call(_options.getElementsByClassName('option'))).map((v: Element) => {
  return v.firstElementChild as HTMLInputElement | HTMLSelectElement;
});

let defaultOptions: Options;
let excludeOptionsFromSharing = ['uiOptions'];

window.tsp = {
  options: {}
};

function setDefaultOptions(): void {
  defaultOptions = {
    compilerOptions: {
      noImplicitAny: false,
      strictNullChecks: false,
      strictFunctionTypes: false,
      strictPropertyInitialization: false,
      noImplicitReturns: false,
      noImplicitThis: false,
      removeComments: false,
      experimentalDecorators: false,
      emitDecoratorMetadata: false,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ES5
    },
    windowOptions: {
      console: true
    },
    uiOptions: {
      autoUpdateUrl: false,
      localStorageBackup: true
    }
  };
}

function bootstrap(): void {
  (document.getElementById('base') as HTMLBaseElement).href = getBaseHref();

  const win = window as any;
  win.require.config({ paths: { vs: '/* @echo MONACO_LOCATION */' } });

  win.MonacoEnvironment = {
    getWorkerUrl: (workerId, label) => {
      return 'proxy.js';
    }
  };

  win.require(['/* @echo MONACO_ENTRY */'], init);
}

function init(editor: any): void {
  _tsVersion.innerText = '/* @echo TYPESCRIPT_VERSION */';
  const hashValue = getHash();
  const backup = getLocalStorage();
  let useBackup = false;

  setDefaultOptions();
  expose();

  let defaultValue = [
    'function foo(bar: number): string {',
    '    return `${bar}`;',
    '}',
    ''
  ].join('\n');

  if (!backup || !backup.options || !backup.options.uiOptions) {
    useBackup = true;
  } else if (backup.options.uiOptions.localStorageBackup) {
    useBackup = true;
  }

  setOptions({ uiOptions: { localStorageBackup: useBackup } });

  if (useBackup && backup && backup.options) {
    for (let opt in excludeOptionsFromSharing) {
      if (backup.options.hasOwnProperty(opt)) {
        const o = {};
        o[opt] = backup.options[opt];
        setOptions(o);
      }
    }
  }

  if (hashValue && !!hashValue.editor) {
    defaultValue = hashValue.editor;
  } else if (useBackup && backup && !!backup.editor) {
    defaultValue = backup.editor;
  }

  if (hashValue && hashValue.options) {
    setOptions(hashValue.options);
  } else if (useBackup && backup && backup.options) {
    setOptions(backup.options);
  }

  updateCompilerOptions();

  tsEditor = monaco.editor.create(_editorTs, {
    value: defaultValue,
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
  updateHash(true);
  updateLocalStorage(true)
  fadeOut(_loading);
}

function expose() {
  window.tsp.options = defaultOptions;
  window.tsp.compile = onCodeChange;
  window.tsp.emit = onCodeChange;
  window.tsp.run = runCode;
  window.tsp.share = getShareableUrl;
  window.tsp.reset = resetLocalStorage;
  window.tsp.sync = syncOptions;
  window.tsp.setCompilerOption = setCompilerOption;
}

function setCompilerOption(name: string, value: any): void {
  window.tsp.options.compilerOptions[name] = value;
  initOptions();
  updateCompilerOptions();
  onCodeChange();
}

function syncOptions(): void {
  initOptions();
  updateCompilerOptions();
}

function keyBindings(this: Window, ev: KeyboardEvent) {
  if (ev.ctrlKey && ev.which === 82 /* r */) {
    runCode();
  }

  if ((ev.ctrlKey || ev.metaKey) && ev.which === 83 /* s */) {
    ev.preventDefault();
  }
}

function initOptions() {
  const inputs = _optionsList;

  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    let option = input.classList.item(0);

    if (options()[option].hasOwnProperty(input.name)) {
      if (input instanceof HTMLInputElement) {
        if ((input as HTMLInputElement).type === 'checkbox') {
          (input as HTMLInputElement).checked = !!defaultOptions[option][input.name];
        } else if ((inputs[i] as HTMLInputElement).type === 'text') {
          (input as HTMLInputElement).value = `${defaultOptions[option][input.name]}`;
        }
      } else if (input instanceof HTMLSelectElement) {
        (input as HTMLSelectElement).value = `${defaultOptions[option][input.name]}`;
      }
    }

    input.onchange = onOptionChange;
  }
}

function onOptionChange(this: HTMLInputElement | HTMLSelectElement, ev: Event): any {
  let option = this.classList.item(0);

  let value = options()[option][this.name];

  if (this instanceof HTMLInputElement) {
    if ((this as HTMLInputElement).type === 'checkbox') {
      value = !!(this as HTMLInputElement).checked;
    } else if ((this as HTMLInputElement).type === 'text') {
      value = (this as HTMLInputElement).value;
    }
  } else if (this instanceof HTMLSelectElement) {
    value = (this as HTMLSelectElement).value;
  } else {
    value = (this as any).value || void 0;
  }

  options()[option][this.name] = value;

  updateCompilerOptions();
  onCodeChange();
  updateHash();
  updateLocalStorage();
  updateShareableUrl();
}

function onCodeChange(event?: monaco.editor.IModelContentChangedEvent): void {
  if (event !== void 0) {
    updateHash();
    updateLocalStorage();
  }

  showProcessingIndicator();

  getService()
    .then(service => {
      return service.getEmitOutput(tsEditor.getModel().uri.toString())
    }, hideProcessingIndicator)
    .then((result: ts.EmitOutput) => {
      if (result.emitSkipped) {
        return false;
      }

      if (!result.outputFiles || !result.outputFiles[0]) {
        return false;
      }

      return result.outputFiles[0].text;
    }, hideProcessingIndicator)
    .then(text => {
      if (typeof text === 'string') {
        updateJsEditor(text);
      }

      return !!text;
    }, hideProcessingIndicator)
    .then(updated => {
      hideProcessingIndicator();
    }, hideProcessingIndicator)
}

function runCode(): void {
  let win: Window;

  if (!runWindow || runWindow.closed) {
    windowOpened();
    win = window.open('about:blank', '', 'width=800,height=600');
    runWindow = win;
  } else {
    win = runWindow;
    windowRefreshed();
  }

  win.onunload = null;
  win.location.href = 'about:blank'

  setTimeout(() => {
    win.document.open()
    win.document.write(getWindowCode());
    win.document.close();
    win.onunload = windowUnloaded;
  }, 50);
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

function updateHash(initial?: boolean): void {
  if (!!window.tsp.options.uiOptions.autoUpdateUrl) {
    if (!initial) {
      window.location.hash = encode(exclude(getHashValue()));
    }
  } else if(!!window.location.hash) {
    window.location.hash = '';
  }
}

function getLocalStorage(): HashValue {
  const hash = localStorage.getItem('tsp');
  if (!hash) return {};
  return decode(hash);
}

function updateLocalStorage(initial?: boolean): void {
  if (!!window.tsp.options.uiOptions.localStorageBackup) {
    localStorage.setItem('tsp', encode(getHashValue()));
  } else {
    localStorage.setItem('tsp', encode({ options: { uiOptions: { localStorageBackup: false } } }));
  }
}

function resetLocalStorage(reload = false, event: Event) {
  if (event) event.preventDefault();
  const confirmation = confirm('Are you sure? All your changes will be lost.');
  if (!confirmation) return;
  localStorage.removeItem('tsp');
  if (reload) window.location.href = window.location.href.split('#')[0];
}

function updateShareableUrl(): void {
  (_shareableUrl as HTMLInputElement).value = getShareableUrl();
}

function getShareableUrl(): string {
  return window.location.href
    .replace(window.location.hash, '')
    .replace('#', '') +
    `#${encode(exclude(getHashValue()))}`;
}

function encode(value): string {
  return btoa(encodeURIComponent(JSON.stringify(value)));
}

function decode(hash: string): HashValue {
  return JSON.parse(decodeURIComponent(atob(hash)));
}

function exclude(value: HashValue): HashValue {
  value = JSON.parse(JSON.stringify(value));

  for (let opt of excludeOptionsFromSharing) {
    value.options[opt] = void 0;
  }

  return value;
}

function getHashValue(exclude = true): HashValue {
  const value = {
    editor: tsEditor.getValue(),
    options: getOptions()
  };

  return value;
}

function getHash(): HashValue {
  const hash = window.location.hash.substr(1);
  if (!hash) return {};
  return decode(hash);
}

function updateJsEditor(text: string): void {
  jsEditor.getModel().setValue(text);
}

function updateCompilerOptions(): void {
  const options = getOptions();
  options.compilerOptions.allowNonTsExtensions = true;
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options.compilerOptions);
}

function prepareWindowCode(html: string): string {
  return html
    .replace(new RegExp(/__BASE__/), window.location.href.split('#')[0].replace(/\/?$/, '/'))
    .replace(new RegExp(/__VERSION__/g), '/* @echo VERSION */');
}

function getWindowCode(html?: string): string {
  html = html !== void 0
   ? html : options().windowOptions.console
   ? runWindowCodeConsole : runWindowCodePlain;
  return html.replace(/__CODE__/, jsEditor.getValue())
}

function setOptions(opts: { [index: string]: any }, base = options()) {
  for (let k in opts) {
    if (opts[k] !== null && typeof opts[k] === 'object') {
      setOptions(opts[k], base[k]);
    } else {
      base[k] = opts[k];
    }
  }
}

function options(): Options {
  return window.tsp.options;
}

function getOptions(): Options {
  return JSON.parse(JSON.stringify(options()));
}

function getBaseHref(): string {
  return window.location.href.split('#')[0].replace(/\/?$/, '/');
}

function getService(): monaco.Promise<any> {
  return monaco.languages.typescript.getTypeScriptWorker()
    .then(worker => worker(tsEditor.getModel().uri))
}

function toggleOptions(this: HTMLElement, ev: Event): void {
  const show = this.classList.toggle('active');

  if (show) {
    updateShareableUrl();
  }

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
