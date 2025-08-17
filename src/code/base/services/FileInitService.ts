import path from "path";
import fs from "fs";

export class FileInitService {
  public readonly appDataPath =
    process.platform === "win32"
      ? process.env.APPDATA
      : path.join(process.env.HOME, ".config");

  public readonly PUBLIC_FOLDER_PATH = path.join(
    this.appDataPath,
    "MeridiaLocalStorage",
    "config"
  );

  public readonly SETTINGS_JSON_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "settings.json"
  );

  public readonly STORE_JSON_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "store.json"
  );

  constructor() {
    this.ensureFolders();
    this.ensureFiles();
  }

  private ensureFolders() {
    const folders = [this.PUBLIC_FOLDER_PATH];
    folders.forEach((folder) => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
    });
  }

  private ensureFiles() {
    const jsonDefaults = {
      [this.SETTINGS_JSON_PATH]: {},
      [this.STORE_JSON_PATH]: {},
    };

    Object.entries(jsonDefaults).forEach(([filePath, defaultContent]) => {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      }
    });
  }
}
