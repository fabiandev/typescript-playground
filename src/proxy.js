const params = new URLSearchParams(location.search);

const baseUrl = params.get("baseUrl");
const locationUrl = params.get("locationUrl");

if (!baseUrl || !locationUrl) {
  throw new Error('Missing parameters')
}

self.MonacoEnvironment = {
  baseUrl: baseUrl
};

importScripts(locationUrl + '/base/worker/workerMain.js');
