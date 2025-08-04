import { mainWindow } from "../../../main";
import { ipcMain } from "electron";
import * as chokidar from "chokidar";
import fs from "fs";

export class EditorFileSystemService {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();

  constructor() {
    ipcMain.on("watch-python-files", (e, filePaths: string[]) => {
      if (mainWindow) this.watchPythonFiles(filePaths);
    });
  }

  private watchPythonFiles(filePaths: string[]) {
    filePaths.forEach((filePath) => {
      if (this.watchers.has(filePath)) return;

      const watcher = chokidar.watch(filePath, { ignoreInitial: true });

      watcher.on("change", (path) => {
        const content = fs.readFileSync(path, "utf-8");
        mainWindow.webContents.send("file-content-changed", {
          path,
          content,
        });
      });

      this.watchers.set(filePath, watcher);
    });
  }
}
