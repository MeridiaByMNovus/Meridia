import { BrowserWindow } from "electron";
import * as chokidar from "chokidar";
import fs from "fs";
import { StorageService } from "./StorageService";
import { FileInitService } from "./FileInitService";

export class DataChangeService {
  private DATA_JSON_PATH = new FileInitService().DATA_JSON_PATH;
  private watcher: chokidar.FSWatcher;
  private mainWindow: BrowserWindow;
  private welcomeWizardWindow: BrowserWindow;
  private initialTree: any;

  constructor(mainWindow: BrowserWindow, welcomeWizardWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.welcomeWizardWindow = welcomeWizardWindow;
    this.initialTree = StorageService.get("fileTree");
    this.watcher = chokidar.watch(this.DATA_JSON_PATH ?? "", {
      persistent: true,
      ignoreInitial: true,
    });

    this.setupWatcher();
    this.evaluateWindowState(this.readTreeFromDisk());
  }

  private setupWatcher() {
    this.watcher.on("change", (path) => {
      const currentTree = this.readTreeFromDisk();
      this.evaluateWindowState(currentTree);
    });
  }

  private readTreeFromDisk() {
    try {
      const content = fs.readFileSync(this.DATA_JSON_PATH, "utf-8");
      const json = JSON.parse(content);
      return json["fileTree"];
    } catch {
      return null;
    }
  }

  private evaluateWindowState(tree: any) {
    if (tree && tree !== this.initialTree) {
      this.mainWindow.show();
      this.welcomeWizardWindow.hide();
    } else {
      this.mainWindow.hide();
      this.welcomeWizardWindow.show();
    }
  }

  dispose() {
    this.watcher.close();
  }
}
