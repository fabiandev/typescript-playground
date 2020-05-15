/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

declare module '*.html' {
  const content: {
    default: string;
  };
  export = content;
}
