import { app, BrowserWindow } from "electron";
import { HttpServer } from "./server.js";
import dotenv from "dotenv";
import path from "path";
import "./code/base/common/base.file.create.js";
import "./code/base/node/files.node.js";
import "./code/base/node/mira.node.js";
import "./code/base/node/init.node.js";
import "./code/base/common/editor/editor.main.js";

dotenv.config();

let httpServer: HttpServer;
let PORT: number = 0;

if (process.env.NODE_ENV === "development") {
  const electronReload = require("electron-reload");
  electronReload(__dirname, {});
  httpServer = new HttpServer(5281);
  PORT = httpServer._port;
  httpServer._serve();
}

export const PRELOAD_PATH = path.join(
  __dirname,
  "code",
  "base",
  "base.preload.js"
);

export const MAIN_HTML_PATH =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${PORT}/code/workbench/common/workbench.renderer/code.html`
    : path.join(
        __dirname,
        "code",
        "workbench",
        "common",
        "workbench.renderer",
        "code.html"
      );

export let mainWindow: BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(MAIN_HTML_PATH);
    mainWindow.webContents.openDevTools();
  } else mainWindow.loadFile(MAIN_HTML_PATH);

  mainWindow.maximize();
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
