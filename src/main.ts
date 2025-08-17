import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import chokidar from "chokidar";
import fs from "fs";
import dotenv from "dotenv";
import { StorageService } from "./code/base/services/StorageService.js";
import { MenuService } from "./code/base/services/MenuService.js";
import { FileTreeService } from "./code/base/services/FileTreeService.js";
import { FileInitService } from "./code/base/services/FileInitService.js";
import { PythonService } from "./code/base/services/PythonService.js";
import { DialogService } from "./code/base/services/DialogService.js";
import { UpdateService } from "./code/base/services/UpdateService.js";
import { ProjectService } from "./code/base/services/ProjectService.js";
import { open_folder } from "./code/base/common/functions.js";
import { IpcCommandsRegisteryService } from "./code/base/common/IpcCommandsRegisteryService.js";
import { SpawnPty } from "./code/base/common/spawnPty.js";

dotenv.config();

let ptyServer: SpawnPty;

const PORT = 3123;

if (process.env.NODE_ENV === "development") {
  const electronReload = require("electron-reload");
  electronReload(__dirname, {});
}

const PRELOAD_PATH = path.join(
  __dirname,
  "./code/base/window/preload/preload.js"
);

const MAIN_HTML_PATH =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}`
    : path.join(__dirname, "index.html");

export let mainWindow: BrowserWindow;
export let welcomeWizardWindow: BrowserWindow;

function RegisterIpcHandlers(): void {
  ipcMain.handle("minimize", () => mainWindow.minimize());
  ipcMain.handle("maximize", () => mainWindow.maximize());
  ipcMain.handle("restore", () => mainWindow.restore());
  ipcMain.handle("isMaximized", () => mainWindow.isMaximized());
  ipcMain.handle("close", () => mainWindow.close());

  ipcMain.handle("read-image-base-64", (_, path) => {
    const ext = path.split(".").pop();
    const base64 = fs.readFileSync(path, { encoding: "base64" });
    return `data:image/${ext};base64,${base64}`;
  });

  ipcMain.handle("open-folder", async () => {
    open_folder();
  });
}

interface CreateWindowOptions {
  width: number;
  height: number;
  preload: string;
  entry: string;
  title: string;
  isMain?: boolean;
  resizable?: boolean;
  show?: boolean;
}

function createWindow({
  width,
  height,
  preload,
  entry,
  title,
  show = false,
  isMain = false,
  resizable = true,
}: CreateWindowOptions): BrowserWindow {
  const window = new BrowserWindow({
    width,
    height,
    frame: false,
    title,
    minWidth: width,
    minHeight: height,
    maxWidth: isMain ? undefined : width,
    maxHeight: isMain ? undefined : height,
    resizable: resizable,
    maximizable: isMain,
    backgroundColor: "#1A1A1A",
    icon: path.resolve(
      __dirname,
      "code",
      "resources",
      "assets",
      "icons",
      "icon.ico"
    ),
    show: show,
    webPreferences: {
      preload,
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  window.maximize();

  window.loadURL(entry);

  window.on("maximize", () => {
    window.webContents.send("window-changed-to-maximized");
  });

  window.on("unmaximize", () => {
    window.webContents.send("window-changed-to-restore");
  });

  window.on("close", () => {
    window.webContents.send("handle-window-closing");
  });

  window.webContents.on("did-finish-load", () => {
    window.webContents.send(
      window.isMaximized()
        ? "window-changed-to-maximized"
        : "window-changed-to-restore"
    );
  });

  window.once("ready-to-show", () => {
    if (process.env.NODE_ENV === "development")
      window.webContents.openDevTools();
    if (isMain) window.show();
  });

  return window;
}

app.whenReady().then(async () => {
  const cwd = StorageService.get("fileTree")?.root || "/";

  mainWindow = createWindow({
    width: 800,
    height: 600,
    preload: PRELOAD_PATH,
    entry: MAIN_HTML_PATH,
    title: "Meridia",
    isMain: true,
    show: true,
  });

  ptyServer = new SpawnPty(ipcMain, {
    shell: process.platform === "win32" ? "powershell.exe" : "/bin/zsh",
    cwd: cwd,
    defaultCols: 120,
    defaultRows: 40,
  });

  ptyServer.registerIpcHandlers();

  IpcCommandsRegisteryService();

  const fileTreeService = new FileTreeService();
  const fileInitService = new FileInitService();
  new MenuService();
  new PythonService();
  new DialogService();
  new UpdateService();
  new ProjectService();

  window.store_path = fileInitService.STORE_JSON_PATH;

  const watcher = chokidar.watch(window.store_path);

  watcher.on("change", (filePath) => {
    const content = JSON.parse(
      fs.readFileSync(filePath, { encoding: "utf-8" })
    );

    fileTreeService.changeCwd(content.fileTree.root);
  });

  RegisterIpcHandlers();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  ptyServer.dispose();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow({
      width: 800,
      height: 600,
      preload: PRELOAD_PATH,
      entry: MAIN_HTML_PATH,
      title: "Meridia",
      isMain: true,
    });
  }
});
