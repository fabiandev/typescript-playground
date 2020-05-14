"use strict";var params=new URLSearchParams(location.search),baseUrl=params.get("baseUrl"),locationUrl=params.get("locationUrl");if(!baseUrl||!locationUrl)throw new Error("Missing parameters");self.MonacoEnvironment={baseUrl:baseUrl},importScripts(locationUrl+"/base/worker/workerMain.js");
//# sourceMappingURL=proxy.js.map
