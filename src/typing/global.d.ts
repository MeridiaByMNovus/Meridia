import { Theme } from "../code/workbench/common/workbench.theme.js";
import { Layout } from "../code/workbench/workbench.layout.js";
import {
  filesBridge,
  fsBridge,
  ipcBridge,
  miraBridge,
  pathBridge,
  storageBridge,
} from "../code/base/base.preload.js";

declare global {
  interface Window {
    storage: typeof storageBridge;
    fs: typeof fsBridge;
    ipc: typeof ipcBridge;
    path: typeof pathBridge;
    files: typeof filesBridge;
    mira: typeof miraBridge;
  }
}
