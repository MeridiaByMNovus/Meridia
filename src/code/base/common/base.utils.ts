import path from "path";

export const PUBLIC_FOLDER =
  process.platform === "win32"
    ? process.env.APPDATA
    : path.join(process.env.HOME!, ".config");

export const PUBLIC_FOLDER_PATH = path.join(PUBLIC_FOLDER!, "Meridia", "User");

export const STORE_JSON_PATH = path.join(PUBLIC_FOLDER_PATH, "store.json");
