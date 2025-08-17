import { Workbench } from "../../../workbench.js";
import { ExtensionManager } from "../../../../platform/extension/manager.js";
import { Core } from "../../../../platform/extension/core.js";
import { InjectResources } from "../../injectResources.js";

window.onload = async () => {
  InjectResources();

  window.target_window = "main";

  const extensionCore = new Core();

  window.extensionManager = new ExtensionManager(
    extensionCore,
    window.pathBridge.join(
      window.pathBridge.__dirname(),
      "..",
      "..",
      "..",
      "..",
      "extensions"
    )
  );

  await window.extensionManager.loadExtensions();

  new Workbench(extensionCore);

  setTimeout(() => {
    window.extensionManager.runAllExtensions();
  }, 500);

  window.electron.ipcRenderer.on("window-reset", async () => {
    window.location.reload();
  });
};

self.MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    const base = "/workers/";
    switch (label) {
      case "json":
        return new Worker(`${base}json.worker.js`, { type: "module" });
      case "css":
        return new Worker(`${base}css.worker.js`, { type: "module" });
      case "html":
        return new Worker(`${base}html.worker.js`, { type: "module" });
      case "typescript":
      case "javascript":
        return new Worker(`${base}ts.worker.js`, { type: "module" });
      default:
        return new Worker(`${base}editor.worker.js`, { type: "module" });
    }
  },
};
