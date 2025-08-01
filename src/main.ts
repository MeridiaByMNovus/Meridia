import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
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
import { CommandRegistry } from "./code/base/services/CommandRegistryService.js";
import { Server } from "./code/platform/server/server.js";
import { SpawnPty } from "./code/base/common/spawnPty.js";

dotenv.config();

let server;
let ptyServer: SpawnPty;

if (process.env.NODE_ENV === "development") {
  server = new Server();
}

let PORT = (server && server.port) ?? 2222;

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

const WELCOME_WIZARD_HTML_PATH = path.join(
  __dirname,
  "./code/base/window/welcomeWizard/index.html"
);

export let mainWindow: BrowserWindow;
export let welcomeWizardWindow: BrowserWindow;

const CommandRegister = new CommandRegistry().register;

function RegisterIpcHandlers(): void {
  ipcMain.handle("minimize", (_, window: "main" | "welcomeWizard") =>
    getWindow(window).minimize()
  );
  ipcMain.handle("maximize", (_, window: "main" | "welcomeWizard") =>
    getWindow(window).maximize()
  );
  ipcMain.handle("restore", (_, window: "main" | "welcomeWizard") =>
    getWindow(window).restore()
  );
  ipcMain.handle("isMaximized", (_, window: "main" | "welcomeWizard") =>
    getWindow(window).isMaximized()
  );
  ipcMain.handle("close", (_, window: "main" | "welcomeWizard") =>
    getWindow(window).close()
  );

  ipcMain.handle("read-image-base-64", (_, path) => {
    const ext = path.split(".").pop();
    const base64 = fs.readFileSync(path, { encoding: "base64" });
    return `data:image/${ext};base64,${base64}`;
  });

  ipcMain.handle("open-folder", async () => {
    open_folder();
  });
}

function getWindow(name: "main" | "welcomeWizard"): BrowserWindow {
  if (name === "main") return mainWindow;
  if (name === "welcomeWizard") return welcomeWizardWindow;
  throw new Error(`Window '${name}' is not initialized`);
}

interface CreateWindowOptions {
  width: number;
  height: number;
  preload: string;
  entry: string;
  title: string;
  isMain?: boolean;
  resizable?: boolean;
}

function createWindow({
  width,
  height,
  preload,
  entry,
  title,
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
    icon: path.resolve(__dirname, "..", "..", "src", "assets", "icon.ico"),
    show: false,
    webPreferences: {
      preload,
    },
  });

  if (isMain) window.maximize();

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
    if (process.env.NODE_ENV === "development") {
      window.webContents.openDevTools();
    }
    isMain && window.show();
  });

  return window;
}

app.whenReady().then(() => {
  const cwd = StorageService.get("fileTree")?.root || "/";

  mainWindow = createWindow({
    width: 800,
    height: 600,
    preload: PRELOAD_PATH,
    entry: MAIN_HTML_PATH,
    title: "Meridia",
    isMain: true,
  });

  welcomeWizardWindow = createWindow({
    width: 1100,
    height: 750,
    preload: PRELOAD_PATH,
    entry: WELCOME_WIZARD_HTML_PATH,
    title: "Meridia – Welcome",
    resizable: false,
  });

  ptyServer = new SpawnPty(ipcMain, {
    shell: process.platform === "win32" ? "powershell.exe" : "/bin/zsh",
    cwd: process.cwd(),
    defaultCols: 120,
    defaultRows: 40,
  });

  ptyServer.registerIpcHandlers();

  IpcCommandsRegisteryService();

  new MenuService();
  new FileTreeService();
  new FileInitService();
  new PythonService();
  new DialogService();
  new UpdateService();
  new ProjectService();

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
