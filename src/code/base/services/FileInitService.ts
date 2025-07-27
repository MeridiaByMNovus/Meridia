import path from "path";
import fs from "fs";
import { app } from "electron";

export class FileInitService {
  public readonly PUBLIC_FOLDER_PATH = path.join(
    app.getPath("userData"),
    "MeridiaLocalStorage"
  );
  public readonly PUBLIC_THEME_FOLDER_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "theme"
  );
  public readonly PUBLIC_DATA_FOLDER_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "data"
  );

  public readonly SETTINGS_JSON_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "settings.json"
  );
  public readonly DATA_JSON_PATH = path.join(
    this.PUBLIC_DATA_FOLDER_PATH,
    "data.json"
  );
  public readonly STORAGE_JSON_PATH = path.join(
    this.PUBLIC_FOLDER_PATH,
    "storage.json"
  );

  constructor() {
    this.ensureFolders();
    this.ensureFiles();
  }

  private ensureFolders() {
    const folders = [
      this.PUBLIC_FOLDER_PATH,
      this.PUBLIC_THEME_FOLDER_PATH,
      this.PUBLIC_DATA_FOLDER_PATH,
    ];
    folders.forEach((folder) => {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
    });
  }

  private ensureFiles() {
    const jsonDefaults = {
      [this.SETTINGS_JSON_PATH]: {},
      [this.DATA_JSON_PATH]: {},
      [this.STORAGE_JSON_PATH]: {},
    };

    Object.entries(jsonDefaults).forEach(([filePath, defaultContent]) => {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      }
    });
  }
}
