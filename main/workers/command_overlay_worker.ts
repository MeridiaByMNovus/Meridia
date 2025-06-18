import { ipcMain } from "electron";
import {
  handleNewFile,
  handleOpenFile,
  handleOpenFolder,
  handleSaveCurrentFile,
  handleOpenSettings,
  handleOpenMeridiaStudio,
  handleOpenSidebar,
  handleOpenRightPanel,
  handleOpenBottomPanel,
  handleOpenOutput,
  handleOpenTerminal,
  handleRun,
} from "./functions_worker";

const commandHandlers: any = {
  new: handleNewFile,
  open: handleOpenFile,
  "open-folder": () => handleOpenFolder(),
  save: handleSaveCurrentFile,
  settings: handleOpenSettings,
  "meridia-studio": handleOpenMeridiaStudio,
  "toggle-sidebar": handleOpenSidebar,
  "toggle-right-panel": handleOpenRightPanel,
  "toggle-bottom-panel": handleOpenBottomPanel,
  "open-output": handleOpenOutput,
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
