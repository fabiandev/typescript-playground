const params = new URLSearchParams(location.search);

const baseUrl = params.get("baseUrl");
const locationUrl = params.get("locationUrl");

self.MonacoEnvironment = {
  baseUrl: baseUrl
};

importScripts(locationUrl + '/base/worker/workerMain.js');
