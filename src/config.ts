import versions = require("../versions.json");

export interface EditorConfig {
  tsVersion: string;
  entry: string;
  baseUrl: string;
  locationUrl: string;
  loaderUrl: string;
  monaco: string;
  module: string;
  hide?: boolean;
}

export { versions };

export function latestVersion() {
  return Object.keys(versions)
    .filter((key) => key !== "nightly" && !key.includes("-"))
    .sort()
    .pop();
}

export function getConfig(tsVersion: string = "latest"): EditorConfig {
  if (tsVersion == null) {
    tsVersion = "latest";
  }

  if (tsVersion === "latest") {
    tsVersion = latestVersion();
  }

  const config = versions[tsVersion.toLowerCase()] || versions[latestVersion()];

  if (config == null) {
    throw new Error("Could not load TypeScript version");
  }

  const monacoUrl = `https://unpkg.com/${config.module}@${config.monaco}`;
  const baseUrl = `${monacoUrl}/min`;

  return {
    ...config,
    entry: "vs/editor/editor.main",
    tsVersion,
    monacoUrl,
    baseUrl,
    locationUrl: `${baseUrl}/vs`,
    loaderUrl: `${baseUrl}/vs/loader.js`,
  };
}
