import versions = require("../versions.json");

type TsVersionConfigDefinition = {
  monaco: string;
  module: string;
  hide?: boolean;
};

type TsVersionConfigMap = {
  [key: string]: TsVersionConfigDefinition;
  latest: TsVersionConfigDefinition;
  nightly: TsVersionConfigDefinition;
};

export interface TsVersionConfig extends TsVersionConfigDefinition {
  version: string;
  entry: string;
  baseUrl: string;
  locationUrl: string;
  loaderUrl: string;
}

export { versions };

export function latestVersion() {
  return Object.keys(versions)
      .filter((key) => key !== "nightly" && !key.includes("-"))
      .sort()
      .pop();
}

export function getConfig(version: string = "latest"): TsVersionConfig {
  if (version === "latest") {
    version = latestVersion();
  }

  const config = versions[version.toLowerCase()];

  if (config == null) {
    throw new Error("Could not load TypeScript version");
  }

  const monacoUrl = `https://unpkg.com/${config.module}@${config.monaco}`;
  const baseUrl = `${monacoUrl}/min`;

  return {
    ...config,
    entry: "vs/editor/editor.main",
    version,
    monacoUrl,
    baseUrl,
    locationUrl: `${baseUrl}/vs`,
    loaderUrl: `${baseUrl}/vs/loader.js`,
  };
}
