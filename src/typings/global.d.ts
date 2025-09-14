import {
  dialogBridge,
  folderBridge,
  filesystem,
  ipcBridge,
  menuBridge,
  pathBridge,
  pythonBridge,
  systemBridge,
  utilsBridge,
  watchBridge,
  geminiBridge,
  windowManagerBridge,
  assistBridge,
} from "../code/base/window/preload/preload.js";
import { ExtensionManager } from "../code/platform/extension/manager.js";

declare global {
  interface Window {
    filesystem: typeof filesystem;
    path: typeof pathBridge;
    folder: typeof folderBridge;
    windowmanager: typeof windowManagerBridge;
    menu: typeof menuBridge;
    dialog: typeof dialogBridge;
    python: typeof pythonBridge;
    watch: typeof watchBridge;
    ipc: typeof ipcBridge;
    system: typeof systemBridge;
    utils: typeof utilsBridge;
    gemini: typeof geminiBridge;
    assist: typeof assistBridge;
    store_path: string;
    set_folder_data: Function;
    target_window: string;
    extensionManager: ExtensionManager;

    __gutter_cleanup_bound__?: boolean;
  }
}
