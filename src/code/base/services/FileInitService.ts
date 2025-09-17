import path from "path";
import fs from "fs";
import { log } from "../common/functions.js";

export class FileInitService {
  public readonly appDataPath =
    process.platform === "win32"
      ? process.env.APPDATA
      : path.join(process.env.HOME, ".config");

  public readonly PUBLIC_FOLDER_PATH = path.join(
    this.appDataPath,
    "Meridia",
    "User"
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
    log("info", "FileInitService initializing...");

    log("debug", "Platform and path configuration", {
      platform: process.platform,
      appDataPath: this.appDataPath,
      publicFolderPath: this.PUBLIC_FOLDER_PATH,
      settingsJsonPath: this.SETTINGS_JSON_PATH,
      storeJsonPath: this.STORE_JSON_PATH,
      homeEnv: process.env.HOME,
      appDataEnv: process.env.APPDATA,
    });

    try {
      this.ensureFolders();
      this.ensureFiles();
      log("info", "FileInitService initialized successfully");
    } catch (error) {
      log("error", "Failed to initialize FileInitService", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private ensureFolders() {
    log("info", "Ensuring required folders exist...");

    const folders = [this.PUBLIC_FOLDER_PATH];
    log("debug", "Folders to check/create", { folders });

    folders.forEach((folder) => {
      const startTime = Date.now();

      try {
        log("debug", "Checking folder existence", { folder });

        if (!fs.existsSync(folder)) {
          log("info", "Folder does not exist, creating...", { folder });

          fs.mkdirSync(folder, { recursive: true });
          const duration = Date.now() - startTime;

          log("info", "Folder created successfully", {
            folder,
            duration: `${duration}ms`,
            recursive: true,
          });
        } else {
          const duration = Date.now() - startTime;
          log("debug", "Folder already exists", {
            folder,
            duration: `${duration}ms`,
          });
        }

        const stats = fs.statSync(folder);
        log("debug", "Folder verification complete", {
          folder,
          isDirectory: stats.isDirectory(),
          created: stats.birthtime,
          modified: stats.mtime,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Failed to ensure folder", {
          folder,
          error: error.message,
          duration: `${duration}ms`,
          code: error.code,
        });
        throw error;
      }
    });

    log("info", "All folders ensured successfully", {
      folderCount: folders.length,
      folders,
    });
  }

  private ensureFiles() {
    log("info", "Ensuring required files exist...");

    const jsonDefaults = {
      [this.SETTINGS_JSON_PATH]: {},
      [this.STORE_JSON_PATH]: {},
    };

    log("debug", "Files to check/create", {
      fileCount: Object.keys(jsonDefaults).length,
      files: Object.keys(jsonDefaults),
    });

    const results = {
      created: 0,
      existed: 0,
      failed: 0,
      errors: [] as Array<{ file: string; error: string }>,
    };

    Object.entries(jsonDefaults).forEach(([filePath, defaultContent]) => {
      const startTime = Date.now();

      try {
        log("debug", "Checking file existence", { filePath });

        if (!fs.existsSync(filePath)) {
          log("info", "File does not exist, creating with default content...", {
            filePath,
            defaultContent: JSON.stringify(defaultContent),
          });

          const jsonString = JSON.stringify(defaultContent, null, 2);
          const settingsString = fs.readFileSync(
            path.join(
              __dirname,
              "code",
              "resources",
              "data",
              "defaultSettings.json"
            )
          );

          fs.writeFileSync(
            filePath,
            filePath.endsWith("settings.json") ? settingsString : jsonString
          );
          const duration = Date.now() - startTime;

          results.created++;
          log("info", "File created successfully", {
            filePath,
            duration: `${duration}ms`,
            size: jsonString.length,
            encoding: "utf8",
          });
        } else {
          const duration = Date.now() - startTime;
          results.existed++;
          log("debug", "File already exists", {
            filePath,
            duration: `${duration}ms`,
          });
        }

        const stats = fs.statSync(filePath);
        log("debug", "File verification complete", {
          filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isFile: stats.isFile(),
        });

        try {
          const content = fs.readFileSync(filePath, "utf8");
          const parsed = JSON.parse(content);
          log("debug", "File content validation successful", {
            filePath,
            contentLength: content.length,
            parsedKeys: Object.keys(parsed),
            isValidJson: true,
          });
        } catch (parseError) {
          log("warn", "File exists but contains invalid JSON", {
            filePath,
            parseError: parseError.message,
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        results.failed++;
        results.errors.push({
          file: filePath,
          error: error.message,
        });

        log("error", "Failed to ensure file", {
          filePath,
          error: error.message,
          duration: `${duration}ms`,
          code: error.code,
          defaultContent,
        });
        throw error;
      }
    });

    log("info", "File initialization completed", {
      created: results.created,
      existed: results.existed,
      failed: results.failed,
      total: Object.keys(jsonDefaults).length,
      successRate: `${Math.round(((results.created + results.existed) / Object.keys(jsonDefaults).length) * 100)}%`,
    });

    if (results.failed > 0) {
      log("warn", "Some files failed to initialize", {
        failedCount: results.failed,
        errors: results.errors,
      });
    }
  }
}
