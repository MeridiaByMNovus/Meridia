import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
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
import { BootstrapService } from "./code/base/services/BootstrapService.js";
import { log, open_folder } from "./code/base/common/functions.js";
import { IpcCommandsRegisteryService } from "./code/base/common/IpcCommandsRegisteryService.js";
import { SpawnPty } from "./code/base/common/spawnPty.js";

dotenv.config();

log("info", "Application starting...");
log("debug", "Environment variables loaded", {
  NODE_ENV: process.env.NODE_ENV,
});

let ptyServer: SpawnPty;

const PORT = 3123;
log("debug", "Port configured", { PORT });

if (process.env.NODE_ENV === "development") {
  log("info", "Development mode detected, enabling electron-reload");
  const electronReload = require("electron-reload");
  electronReload(__dirname, {});
  log("debug", "Electron reload configured", { watchDir: __dirname });
}

const PRELOAD_PATH = path.join(
  __dirname,
  "./code/base/window/preload/preload.js"
);
log("debug", "Preload path configured", { PRELOAD_PATH });

const MAIN_HTML_PATH =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}/code.html`
    : path.join(__dirname, "code.html");
log("debug", "Main HTML path configured", { MAIN_HTML_PATH });

const BOOTSTRAP_HTML_PATH =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}/bootstrap.html`
    : path.join(__dirname, "bootstrap.html");
log("debug", "Bootstrap HTML path configured", { BOOTSTRAP_HTML_PATH });

export let mainWindow: BrowserWindow;
export let bootstrapWindow: BrowserWindow;

function RegisterIpcHandlers(): void {
  log("info", "Registering IPC handlers...");

  ipcMain.handle("get-gemini-api-key", () => {
    return process.env.GEMINI_KEY;
  });

  ipcMain.handle("minimize", () => {
    log("debug", "IPC: minimize called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle("maximize", () => {
    log("debug", "IPC: maximize called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.maximize();
    }
  });

  ipcMain.handle("restore", () => {
    log("debug", "IPC: restore called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.restore();
    }
  });

  ipcMain.handle("isMaximized", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isMaximized = mainWindow.isMaximized();
      log("debug", "IPC: isMaximized called", { isMaximized });
      return isMaximized;
    }
    return false;
  });

  ipcMain.handle("close", () => {
    log("debug", "IPC: close called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });

  ipcMain.handle("show-main-window", () => {
    log("debug", "IPC: show-main-window called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();

      if (bootstrapWindow && !bootstrapWindow.isDestroyed()) {
        bootstrapWindow.close();
      }

      log("info", "Main window shown, bootstrap window closed");
    }
  });

  ipcMain.handle("bootstrap-complete", () => {
    log("debug", "IPC: bootstrap-complete called");
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();
    }

    if (bootstrapWindow && !bootstrapWindow.isDestroyed()) {
      bootstrapWindow.close();
    }

    log("info", "Bootstrap complete - main window shown");
  });

  ipcMain.handle("show-both-windows", () => {
    log("debug", "IPC: show-both-windows called");

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setPosition(50, 50);
      mainWindow.show();
      mainWindow.focus();
    }

    if (bootstrapWindow && !bootstrapWindow.isDestroyed()) {
      bootstrapWindow.setPosition(300, 100);
      bootstrapWindow.show();
      bootstrapWindow.focus();
    }

    log("info", "Both windows shown at different positions");
  });

  ipcMain.handle("read-image-base-64", (_, path) => {
    log("debug", "IPC: read-image-base-64 called", { path });
    try {
      const ext = path.split(".").pop();
      const base64 = fs.readFileSync(path, { encoding: "base64" });
      const result = `data:image/${ext};base64,${base64}`;
      log("debug", "Image read successfully", {
        path,
        ext,
        size: base64.length,
      });
      return result;
    } catch (error) {
      log("error", "Failed to read image", { path, error: error.message });
      throw error;
    }
  });

  ipcMain.handle("open-folder", async () => {
    log("debug", "IPC: open-folder called");
    try {
      await open_folder();
      log("debug", "Folder opened successfully");
    } catch (error) {
      log("error", "Failed to open folder", { error: error.message });
      throw error;
    }
  });

  log("info", "IPC handlers registered successfully");
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
  titlebar?: boolean;
  fullscreen?: boolean;
  center?: boolean;
  x?: number;
  y?: number;
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
  titlebar = false,
  fullscreen = true,
  center = true,
  x,
  y,
}: CreateWindowOptions): BrowserWindow {
  log("info", "Creating window...", {
    width,
    height,
    title,
    isMain,
    resizable,
    show,
    fullscreen,
    x,
    y,
  });

  const windowOptions: any = {
    width,
    height,
    frame: titlebar,
    title,
    minWidth: width,
    minHeight: height,
    maxWidth: isMain ? undefined : width,
    maxHeight: isMain ? undefined : height,
    resizable: resizable,
    maximizable: isMain,
    backgroundColor: "#1A1A1A",
    show: false,
    icon: path.resolve(
      __dirname,
      "code",
      "resources",
      "assets",
      "icons",
      "icon.ico"
    ),
    webPreferences: {
      preload,
      webSecurity: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  };

  if (x !== undefined) windowOptions.x = x;
  if (y !== undefined) windowOptions.y = y;

  if (!x && !y && center) {
    windowOptions.center = true;
  }

  const window = new BrowserWindow(windowOptions);

  log("debug", "BrowserWindow created", {
    id: window.id,
    preload,
    isVisible: window.isVisible(),
    show: show,
    bounds: window.getBounds(),
  });

  if (process.env.NODE_ENV === "development") {
    log("debug", "Loading URL (development mode)", { entry });
    window.loadURL(entry);
  } else {
    log("debug", "Loading file (production mode)", { entry });
    window.loadFile(entry);
  }

  window.on("maximize", () => {
    log("debug", "Window maximized event triggered");
    if (window.webContents) {
      window.webContents.send("window-changed-to-maximized");
    }
  });

  window.on("unmaximize", () => {
    log("debug", "Window unmaximized event triggered");
    if (window.webContents) {
      window.webContents.send("window-changed-to-restore");
    }
  });

  window.on("close", () => {
    log("debug", "Window close event triggered");
    if (window.webContents) {
      window.webContents.send("handle-window-closing");
    }
  });

  window.webContents.on("did-finish-load", () => {
    const isMaximized = window.isMaximized();
    log("debug", "Window finished loading", {
      windowId: window.id,
      title,
      isMaximized,
      isVisible: window.isVisible(),
      show: show,
      bounds: window.getBounds(),
    });

    if (window.webContents) {
      window.webContents.send(
        isMaximized
          ? "window-changed-to-maximized"
          : "window-changed-to-restore"
      );
    }
  });

  window.once("ready-to-show", () => {
    log("debug", "Window ready to show", {
      windowId: window.id,
      title,
      shouldShow: show,
      isVisible: window.isVisible(),
      bounds: window.getBounds(),
    });

    if (show) {
      window.show();
      log("debug", "Window shown", {
        windowId: window.id,
        title,
        bounds: window.getBounds(),
      });

      window.focus();
      log("debug", "Window focused", { windowId: window.id, title });

      if (fullscreen && isMain) {
        setTimeout(() => {
          window.maximize();
          log("debug", "Window maximized after delay", {
            windowId: window.id,
            bounds: window.getBounds(),
          });
        }, 200);
      }

      if (center) {
        window.center();
      }
    } else {
      log("debug", "Window ready but not shown (show=false)", {
        windowId: window.id,
        title,
      });
    }
  });

  window.on("show", () => {
    if (fullscreen) {
      window.maximize();
    }
    if (process.env.NODE_ENV === "development") {
      log("debug", "Opening DevTools (development mode)");
      window.webContents.openDevTools();
    }
  });

  log("info", "Window created successfully", {
    id: window.id,
    title,
    isVisible: window.isVisible(),
    bounds: window.getBounds(),
  });

  return window;
}

export function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    log("info", "Showing main window...");
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.focus();

    if (process.env.NODE_ENV === "development") {
      mainWindow.webContents.openDevTools();
    }

    if (bootstrapWindow && !bootstrapWindow.isDestroyed()) {
      bootstrapWindow.close();
      log("info", "Bootstrap window closed");
    }
  }
}

export function showBothWindows(): void {
  log("info", "Showing both windows...");

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setPosition(50, 50);
    mainWindow.setSize(1000, 700);
    mainWindow.show();
  }

  if (bootstrapWindow && !bootstrapWindow.isDestroyed()) {
    bootstrapWindow.setPosition(300, 100);
    bootstrapWindow.setSize(800, 600);
    bootstrapWindow.show();
  }
}

app.whenReady().then(async () => {
  log("info", "App is ready, initializing...");

  try {
    const fileTreeData = StorageService.get("fileTree");
    const cwd = fileTreeData?.root || "/";
    log("debug", "Current working directory retrieved", { cwd, fileTreeData });

    RegisterIpcHandlers();

    log("info", "Creating main window...");
    mainWindow = createWindow({
      width: 1000,
      height: 700,
      preload: PRELOAD_PATH,
      entry: MAIN_HTML_PATH,
      title: "Meridia IDE",
      isMain: true,
      show: false,
      fullscreen: true,
      center: false,
      x: 50,
      y: 50,
    });

    log("info", "Creating bootstrap window...");
    bootstrapWindow = createWindow({
      width: 800,
      height: 400,
      preload: PRELOAD_PATH,
      entry: BOOTSTRAP_HTML_PATH,
      title: "Meridia - Bootstrap",
      isMain: false,
      show: true,
      titlebar: true,
      fullscreen: false,
      resizable: false,
      center: true,
      x: 300,
      y: 100,
    });

    if (BootstrapService.getBootstrapStatus()) {
      bootstrapWindow.destroy();
      mainWindow.show();
    } else {
    }

    setTimeout(() => {
      log("debug", "Window status after creation", {
        mainWindow: {
          exists: !!mainWindow,
          destroyed: mainWindow?.isDestroyed(),
          visible: mainWindow?.isVisible(),
          bounds: mainWindow?.getBounds(),
        },
        bootstrapWindow: {
          exists: !!bootstrapWindow,
          destroyed: bootstrapWindow?.isDestroyed(),
          visible: bootstrapWindow?.isVisible(),
          bounds: bootstrapWindow?.getBounds(),
        },
      });
    }, 1000);

    log("info", "Initializing PTY server...");

    const shell =
      process.platform === "win32"
        ? "powershell.exe"
        : process.env.SHELL || "/bin/bash";

    log("debug", "PTY configuration", {
      shell,
      cwd,
      platform: process.platform,
      defaultCols: 120,
      defaultRows: 40,
    });

    ptyServer = new SpawnPty(ipcMain, {
      shell,
      cwd: cwd,
      defaultCols: 120,
      defaultRows: 40,
    });

    ptyServer.registerIpcHandlers();
    log("info", "PTY server initialized and handlers registered");

    log("info", "Registering IPC commands...");
    IpcCommandsRegisteryService();

    log("info", "Initializing services...");
    const fileTreeService = new FileTreeService();
    log("debug", "FileTreeService initialized");

    const fileInitService = new FileInitService();
    log("debug", "FileInitService initialized");

    new MenuService();
    log("debug", "MenuService initialized");

    new PythonService();
    log("debug", "PythonService initialized");

    new DialogService();
    log("debug", "DialogService initialized");

    new UpdateService();
    log("debug", "UpdateService initialized");

    ipcMain.on("bootstrap-init-load", () => {
      new BootstrapService();
      log("debug", "BootstrapService initialized");
    });

    new ProjectService();
    log("debug", "ProjectService initialized");

    log("info", "Application initialization completed successfully");

    setTimeout(() => {
      log("debug", "Final window status", {
        mainWindowVisible: mainWindow?.isVisible(),
        bootstrapWindowVisible: bootstrapWindow?.isVisible(),
        totalWindows: BrowserWindow.getAllWindows().length,
        windowList: BrowserWindow.getAllWindows().map((w) => ({
          id: w.id,
          title: w.getTitle(),
          visible: w.isVisible(),
          bounds: w.getBounds(),
        })),
      });
    }, 2000);
  } catch (error) {
    log("error", "Failed to initialize application", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

app.on("window-all-closed", () => {
  log("info", "All windows closed");
  if (process.platform !== "darwin") {
    log("info", "Quitting application (non-macOS)");
    app.quit();
  } else {
    log("debug", "Not quitting on macOS (keeping in dock)");
  }
});

app.on("before-quit", () => {
  log("info", "Application quitting, cleaning up...");
  try {
    if (ptyServer) {
      ptyServer.dispose();
      log("info", "PTY server disposed");
    }
  } catch (error) {
    log("error", "Error during cleanup", { error: error.message });
  }
});

app.on("activate", () => {
  log("info", "Application activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    log("info", "No windows found, creating main window...");
    mainWindow = createWindow({
      width: 1200,
      height: 800,
      preload: PRELOAD_PATH,
      entry: MAIN_HTML_PATH,
      title: "Meridia IDE",
      isMain: true,
      show: true,
      fullscreen: true,
    });
  } else {
    log("debug", "Windows already exist", {
      windowCount: BrowserWindow.getAllWindows().length,
    });
  }
});

process.on("uncaughtException", (error) => {
  log("error", "Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  log("error", "Unhandled promise rejection", { reason, promise });
});

log("info", "Main process script loaded successfully");
