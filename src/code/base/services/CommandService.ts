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
} from "../common/functions.js";
import { CommandRegistry } from "./CommandRegistryService.js";

const register = new CommandRegistry().register;

export class CommandService {
  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    register("new", handleNewFile);
    register("open", handleOpenFile);
    register("open-folder", () => handleOpenFolder());
    register("save", handleSaveCurrentFile);
    register("settings", handleOpenSettings);
    register("toggle-sidebar", handleOpenSidebar);
    register("toggle-right-panel", handleOpenRightPanel);
    register("toggle-bottom-panel", handleOpenBottomPanel);
    register("open-terminal", handleOpenTerminal);
    register("run", handleRun);
  }
}
