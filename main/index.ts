/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { Pty } from "./electron/pty";
import { PythonConsole } from "./electron/python_console";
import {
  RegisterMenu,
  RegisterUpdateWorker,
  RegisterFileWorker,
  RegisterPythonWorker,
  RegisterCommandOverlayWorker,
  RegisterFileTreeWorker,
  RegisterUiStateWorker,
  RegisterDialogWorker,
  RegisterIpcCommandsWorker,
  RegisterThemeWorker,
  RegisterDataChangeWorker,
  RegisterProjectWorker,
} from "./workers/";
import { handleOpenSetFolder, open_folder } from "./workers/functions_worker";
import { registerCommand } from "./workers/command_worker";
import { StorageWorker } from "./workers/storage_worker";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const WELCOME_WIZARD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

declare global {
  var mainWindow: BrowserWindow | null;
  var welcomeWizardWindow: BrowserWindow | null;
}

global.mainWindow = null;
global.welcomeWizardWindow = null;

export let main_window_preload_webpack_entry =
  MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
export let main_window_webpack_entry = MAIN_WINDOW_WEBPACK_ENTRY;
export let welcome_wizard_webpack_entry = WELCOME_WIZARD_WEBPACK_ENTRY;

export const SELECTED_FOLDER_STORE_NAME = "selected-folder";

function RegisterIpcHandlers(): void {
  ipcMain.handle("minimize", (_, window) =>
    window === "main" ? mainWindow.minimize() : welcomeWizardWindow.minimize()
  );
  ipcMain.handle("maximize", (_, window) =>
    window === "main" ? mainWindow.maximize() : welcomeWizardWindow.maximize()
  );
  ipcMain.handle("restore", (_, window) =>
    window === "main" ? mainWindow.restore() : welcomeWizardWindow.restore()
  );
  ipcMain.handle("close", (_, window) =>
    window === "main" ? mainWindow.close() : welcomeWizardWindow.close()
  );
  ipcMain.handle("isMaximized", (_, window) =>
    window === "main"
      ? mainWindow.isMaximized()
      : welcomeWizardWindow.isMaximized()
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

interface CreateMeridiaWindowOptions {
  width: number;
  height: number;
  preload: string;
  entry: string;
  title: string;
  isMain?: boolean;
  resizable?: boolean;
}

export function createMeridiaWindow({
  width,
  height,
  preload,
  entry,
  title,
  isMain = false,
  resizable = true,
}: CreateMeridiaWindowOptions): BrowserWindow {
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
    icon: path.resolve(__dirname, "..", "..", "src", "assets", "icon.ico"),
    show: false,
    webPreferences: {
      preload,
    },
  });

  if (isMain) window.maximize();

  window.loadURL(entry);

  window.once("ready-to-show", () => {
    if (process.env.NODE_ENV === "development") {
      window.webContents.openDevTools({ mode: "detach" });
    }
    isMain && window.show();
  });

  window.on("maximize", () => {
    registerCommand("window-changed-to-maximized", "");
  });

  window.on("restore", () => {
    registerCommand("window-changed-to-restore", "");
  });

  window.on("close", () => {
    registerCommand("handle-window-closing", "");
  });

  return window;
}

export const open_set_folder = async () => {
  handleOpenSetFolder();
};

app.whenReady().then(() => {
  RegisterIpcCommandsWorker();
  RegisterMenu();
  RegisterCommandOverlayWorker();
  RegisterFileTreeWorker();
  RegisterFileWorker();
  RegisterPythonWorker();
  RegisterUiStateWorker();
  RegisterDialogWorker();
  RegisterUpdateWorker();
  RegisterProjectWorker();
  RegisterIpcHandlers();

  const cwd = StorageWorker.get("fileTree")?.root || "/";

  mainWindow = createMeridiaWindow({
    width: 800,
    height: 600,
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    entry: MAIN_WINDOW_WEBPACK_ENTRY,
    title: "Meridia",
    isMain: true,
  });

  welcomeWizardWindow = createMeridiaWindow({
    width: 1100,
    height: 750,
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    entry: WELCOME_WIZARD_WEBPACK_ENTRY,
    title: "Meridia – Welcome",
    resizable: false,
  });

  Pty({ cwd, ipcMain });
  PythonConsole({ ipcMain });
  RegisterThemeWorker();
  RegisterDataChangeWorker();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMeridiaWindow({
      width: 800,
      height: 600,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      entry: MAIN_WINDOW_WEBPACK_ENTRY,
      title: "Meridia",
      isMain: true,
    });
  }
});
