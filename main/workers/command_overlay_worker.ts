import { ipcMain } from "electron";
import {
  handleNewFile,
  handleOpenFile,
  handleOpenFolder,
  handleSaveCurrentFile,
  handleOpenSettings,
  handleOpenSidebar,
  handleOpenRightPanel,
  handleOpenBottomPanel,
  handleOpenTerminal,
  handleRun,
} from "./functions_worker";

const commandHandlers: any = {
  new: handleNewFile,
  open: handleOpenFile,
  "open-folder": () => handleOpenFolder(),
  save: handleSaveCurrentFile,
  settings: handleOpenSettings,
  "toggle-sidebar": handleOpenSidebar,
  "toggle-right-panel": handleOpenRightPanel,
  "toggle-bottom-panel": handleOpenBottomPanel,
  "open-terminal": handleOpenTerminal,
  run: handleRun,
};

export function RegisterCommandOverlayWorker() {
  ipcMain.on("execute-command", (_, commandId) => {
    const handler = commandHandlers[commandId];
    if (handler) {
      handler();
    } else {
    }
  });
}
