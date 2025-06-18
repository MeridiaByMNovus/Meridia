import path from "path";
import fs from "fs";
import { app, ipcMain } from "electron";
import { IUIState } from "../../src/helpers/types";
import { IEditorSettings } from "../../src/helpers/types";

export const PUBLIC_FOLDER_PATH = path.join(
  app.getPath("userData"),
  "MeridiaLocalStorage"
);

export const PUBLIC_THEME_FOLDER_PATH = path.join(PUBLIC_FOLDER_PATH, "theme");
export const PUBLIC_DATA_FOLDER_PATH = path.join(PUBLIC_FOLDER_PATH, "data");

export const PUBLIC_STUDIO_FOLDER_PATH = path.join(
  PUBLIC_FOLDER_PATH,
  "studio"
);

export const SETTINGS_JSON_PATH = path.join(
  PUBLIC_FOLDER_PATH,
  "settings.json"
);

export const DATA_JSON_PATH = path.join(PUBLIC_DATA_FOLDER_PATH, "data.json");

export const UI_STATE_JSON_PATH = path.join(
  PUBLIC_FOLDER_PATH,
  "ui_state.json"
);

export const STORAGE_JSON_PATH = path.join(PUBLIC_FOLDER_PATH, "storage.json");

export const MERIDIA_STUDIO_VAR_PATH = path.join(
  PUBLIC_STUDIO_FOLDER_PATH,
  "vars.json"
);

export function RegisterFileWorker() {
  [
    PUBLIC_FOLDER_PATH,
    PUBLIC_THEME_FOLDER_PATH,
    PUBLIC_STUDIO_FOLDER_PATH,
    PUBLIC_DATA_FOLDER_PATH,
  ].forEach((folder) => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });

  [
    SETTINGS_JSON_PATH,
    UI_STATE_JSON_PATH,
    MERIDIA_STUDIO_VAR_PATH,
    DATA_JSON_PATH,
  ].forEach((file) => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));
  });

  if (!fs.existsSync(STORAGE_JSON_PATH))
    fs.writeFileSync(STORAGE_JSON_PATH, JSON.stringify({}));

  ipcMain.on("clear-settings", () =>
    fs.writeFileSync(SETTINGS_JSON_PATH, "{}")
  );
  ipcMain.on("set-settings", (_, settings: IEditorSettings) =>
    fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings))
  );

  ipcMain.handle("get-settings", async () => {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_JSON_PATH, "utf-8"));
    } catch (error) {
      return {};
    }
  });

  ipcMain.on("clear-ui-state", () =>
    fs.writeFileSync(UI_STATE_JSON_PATH, "{}")
  );
  ipcMain.on("set-ui-state", (_, state: IUIState) =>
    fs.promises.writeFile(UI_STATE_JSON_PATH, JSON.stringify(state))
  );

  ipcMain.handle("get-ui-state", async () => {
    try {
      const data = fs.readFileSync(UI_STATE_JSON_PATH, "utf-8");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  });

  ipcMain.handle("get-data-studio-variables", (event) => {
    try {
      const data = fs.readFileSync(MERIDIA_STUDIO_VAR_PATH, "utf-8");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  });

  ipcMain.on("set-data-studio-variables", (event, data) => {
    fs.promises.writeFile(MERIDIA_STUDIO_VAR_PATH, JSON.stringify(data));
  });
}
