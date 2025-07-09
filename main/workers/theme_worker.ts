import { ipcMain, BrowserWindow } from "electron";
import { StorageWorker } from "./storage_worker";
import { mainWindow } from "..";
import fs from "fs";

export function RegisterThemeWorker() {
  if (!StorageWorker.get("theme")) {
    StorageWorker.store("theme", "./theme/dark.json");
  }

  mainWindow.webContents.send("initialize-theme", StorageWorker.get("theme"));

  ipcMain.removeAllListeners("change-theme-path");

  ipcMain.on("change-theme-path", (_, path) => {
    StorageWorker.store("theme", path);
    mainWindow.webContents.send("change-theme", path);
  });

  ipcMain.handle("get-theme", () => {
    return StorageWorker.get("theme");
  });
}
