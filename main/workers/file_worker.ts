import path from "path";
import fs from "fs";
import { app, ipcMain } from "electron";

export const PUBLIC_FOLDER_PATH = path.join(
  app.getPath("userData"),
  "MeridiaLocalStorage"
);

export const PUBLIC_THEME_FOLDER_PATH = path.join(PUBLIC_FOLDER_PATH, "theme");
export const PUBLIC_DATA_FOLDER_PATH = path.join(PUBLIC_FOLDER_PATH, "data");

export const SETTINGS_JSON_PATH = path.join(
  PUBLIC_FOLDER_PATH,
  "settings.json"
);

export const DATA_JSON_PATH = path.join(PUBLIC_DATA_FOLDER_PATH, "data.json");

export const STORAGE_JSON_PATH = path.join(PUBLIC_FOLDER_PATH, "storage.json");

export function RegisterFileWorker() {
  [
    PUBLIC_FOLDER_PATH,
    PUBLIC_THEME_FOLDER_PATH,

    PUBLIC_DATA_FOLDER_PATH,
  ].forEach((folder) => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });

  [SETTINGS_JSON_PATH, DATA_JSON_PATH].forEach((file) => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));
  });

  if (!fs.existsSync(STORAGE_JSON_PATH))
    fs.writeFileSync(STORAGE_JSON_PATH, JSON.stringify({}));
}
