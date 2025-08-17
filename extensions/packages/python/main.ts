import {
  Core,
  PyrightProvider,
} from "../../../src/code/platform/extension/core.js";

export function activate(core: Core) {
  core.languageServer.registerProvider(PyrightProvider, {
    name: "Python Language Server (Pyright)",
    language: "python",
    workerPath: "./workers/python.worker.js",
    fileExtensions: [".py", ".pyw"],
    features: {
      diagnostics: true,
      completion: true,
      hover: true,
      signatureHelp: true,
    },
  });
}
