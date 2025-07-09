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
} from "./workers/";
import { handleOpenSetFolder, open_folder } from "./workers/functions_worker";
import { registerCommand } from "./workers/command_worker";
import { StorageWorker } from "./workers/storage_worker";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const NEW_PROJECT_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export let main_window_preload_webpack_entry =
  MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
export let new_project_webpack_entry = NEW_PROJECT_WEBPACK_ENTRY;

export const SELECTED_FOLDER_STORE_NAME = "selected-folder";

export let mainWindow: BrowserWindow;
export let newProjectWindow: BrowserWindow;
export let cwd: string = "";

function registerIpcHandlers(): void {
  ipcMain.handle("minimize", () => mainWindow.minimize());
  ipcMain.handle("maximize", () => mainWindow.maximize());
  ipcMain.handle("restore", () => mainWindow.restore());
  ipcMain.handle("close", () => mainWindow.close());
  ipcMain.handle("isMaximized", () => mainWindow.isMaximized());
  ipcMain.handle("read-image-base-64", (_, path) => {
    const ext = path.split(".").pop();
    const base64 = fs.readFileSync(path, { encoding: "base64" });
    return `data:image/${ext};base64,${base64}`;
  });

  ipcMain.handle("new-project-minimize", () => newProjectWindow.minimize());
  ipcMain.handle("new-project-close", () => newProjectWindow.close());

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
}

export function createMeridiaWindow({
  width,
  height,
  preload,
  entry,
  title,
  isMain = false,
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
  registerIpcHandlers();

  try {
    cwd = StorageWorker.get("fileTree")?.root || "/";
  } catch {
    cwd = "/";
  }

  mainWindow = createMeridiaWindow({
    width: 800,
    height: 600,
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    entry: MAIN_WINDOW_WEBPACK_ENTRY,
    title: "Meridia",
    isMain: true,
  });

  newProjectWindow = createMeridiaWindow({
    width: 1000,
    height: 800,
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    entry: NEW_PROJECT_WEBPACK_ENTRY,
    title: "Meridia – New Project",
  });

  Pty({ cwd, ipcMain });
  PythonConsole({ ipcMain });
  RegisterThemeWorker();
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
