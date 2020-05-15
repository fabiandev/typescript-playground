import versions = require('../versions.json');

export interface EditorConfig {
  tsVersion: string;
  entry: string;
  baseUrl: string;
  locationUrl: string;
  loaderUrl: string;
  proxyPath: string;
  monaco: string;
  module: string;
  hide?: boolean;
}

export function getLatestVersion() {
  return Object.keys(versions)
    .filter((key) => key !== 'nightly' && !key.includes('-'))
    .sort()
    .pop();
}

export function getEditorConfigs(): EditorConfig[] {
  return Object.keys(versions).map((version) => getEditorConfig(version));
}

export function getEditorConfig(tsVersion: string = 'latest'): EditorConfig {
  const latestVersion = getLatestVersion();
  let usedVersion = tsVersion;

  if (usedVersion == null) {
    usedVersion = 'latest';
  }

  if (usedVersion === 'latest') {
    usedVersion = latestVersion;
  }

  if (versions[usedVersion.toLowerCase()] == null) {
    usedVersion = latestVersion;
  }

  const config = versions[usedVersion];

  if (config == null) {
    throw new Error('Could not load TypeScript version');
  }

  const monacoUrl = `https://unpkg.com/${config.module}@${config.monaco}`;

  const baseUrl = `${monacoUrl}/min`;
  const locationUrl = `${baseUrl}/vs`;
  const loaderUrl = `${baseUrl}/vs/loader.js`
  const proxyPath = `proxy.js?baseUrl=${baseUrl}&locationUrl=${locationUrl}`;

  return {
    ...config,
    entry: 'vs/editor/editor.main',
    tsVersion: usedVersion,
    monacoUrl,
    baseUrl,
    locationUrl,
    loaderUrl,
    proxyPath,
  };
}
