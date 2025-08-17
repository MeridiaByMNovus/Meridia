import {
  ERenderer,
  fsBridge,
  pathBridge,
} from "../code/base/window/preload/preload.js";
import { ExtensionManager } from "../code/platform/extension/manager.js";

declare global {
  interface Window {
    electron: typeof ERenderer;
    fsBridge: typeof fsBridge;
    pathBridge: typeof pathBridge;
    store_path: string;
    set_folder_data: Function;
    target_window: string;
    __gutter_cleanup_bound__?: boolean;
    extensionManager: ExtensionManager;
  }
}
