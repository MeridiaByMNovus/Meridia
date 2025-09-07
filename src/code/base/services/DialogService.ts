import { ipcMain, dialog, BrowserWindow } from "electron";
import { log } from "../common/functions.js";

export class DialogService {
  constructor() {
    log("info", "DialogService initializing...");
    try {
      this.registerHandlers();
      log("info", "DialogService initialized successfully");
    } catch (error) {
      log("error", "Failed to initialize DialogService", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private getFocusedWindow() {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();

      if (!focusedWindow) {
        log("warn", "No focused window found, dialog may not display properly");
        return null;
      }

      log("debug", "Retrieved focused window", {
        windowId: focusedWindow.id,
        title: focusedWindow.getTitle(),
        isVisible: focusedWindow.isVisible(),
        isFocused: focusedWindow.isFocused(),
      });

      return focusedWindow;
    } catch (error) {
      log("error", "Error getting focused window", { error: error.message });
      return null;
    }
  }

  private registerHandlers() {
    log("info", "Registering dialog handlers...");

    ipcMain.handle("show-message-box", async (_, data) => {
      const startTime = Date.now();
      log("debug", "Message box request received", {
        type: data?.type || data?.info || "info",
        title: data?.title,
        hasContent: !!data?.content,
        buttonsCount: data?.buttons?.length || 1,
      });

      try {
        const window = this.getFocusedWindow();
        if (!window) {
          throw new Error("No focused window available for message box");
        }

        const options = {
          type: data.info || "info",
          title: data.title,
          message: data.content,
          buttons: data.buttons || ["OK"],
        };

        log("debug", "Showing message box", options);

        const result = await dialog.showMessageBox(window, options);
        const duration = Date.now() - startTime;

        log("info", "Message box completed", {
          response: result.response,
          checkboxChecked: result.checkboxChecked,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Message box failed", {
          error: error.message,
          duration: `${duration}ms`,
          data,
        });
        throw error;
      }
    });

    ipcMain.handle("show-error-message-box", (_, data) => {
      const startTime = Date.now();
      log("debug", "Error message box request received", {
        hasTitle: !!data?.title,
        hasContent: !!data?.content,
        titleType: typeof data?.title,
        contentType: typeof data?.content,
      });

      try {
        const title =
          typeof data.title === "string"
            ? data.title
            : String(data.title ?? "Error");
        const content =
          typeof data.content === "string"
            ? data.content
            : String(data.content ?? "");

        log("debug", "Showing error box", {
          title,
          contentLength: content.length,
        });

        const result = dialog.showErrorBox(title, content);
        const duration = Date.now() - startTime;

        log("info", "Error box completed", {
          title,
          duration: `${duration}ms`,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Error box failed", {
          error: error.message,
          duration: `${duration}ms`,
          data,
        });
        throw error;
      }
    });

    ipcMain.handle("dialog:open-file", async (_, ext?: string[]) => {
      const startTime = Date.now();
      log("debug", "Open file dialog request received", {
        extensions: ext,
        hasFilters: !!ext && ext.length > 0,
      });

      try {
        const window = this.getFocusedWindow();
        if (!window) {
          throw new Error("No focused window available for file dialog");
        }

        const options = {
          properties: ["openFile"] as (
            | "openFile"
            | "multiSelections"
            | "openDirectory"
            | "showHiddenFiles"
            | "createDirectory"
            | "promptToCreate"
            | "noResolveAliases"
            | "treatPackageAsDirectory"
            | "dontAddToRecent"
          )[],
          filters: ext ? [{ name: "Allowed Files", extensions: ext }] : [],
        };

        log("debug", "Showing open file dialog", options);

        const result = await dialog.showOpenDialog(window, options);
        const duration = Date.now() - startTime;
        const filePath = result.canceled ? null : result.filePaths[0];

        log("info", "Open file dialog completed", {
          canceled: result.canceled,
          filePath,
          duration: `${duration}ms`,
        });

        return filePath;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Open file dialog failed", {
          error: error.message,
          duration: `${duration}ms`,
          extensions: ext,
        });
        throw error;
      }
    });

    ipcMain.handle("dialog:open-folder", async () => {
      const startTime = Date.now();
      log("debug", "Open folder dialog request received");

      try {
        const window = this.getFocusedWindow();
        if (!window) {
          throw new Error("No focused window available for folder dialog");
        }

        const options = {
          properties: ["openDirectory"] as (
            | "openFile"
            | "multiSelections"
            | "openDirectory"
            | "showHiddenFiles"
            | "createDirectory"
            | "promptToCreate"
            | "noResolveAliases"
            | "treatPackageAsDirectory"
            | "dontAddToRecent"
          )[],
        };

        log("debug", "Showing open folder dialog", options);

        const result = await dialog.showOpenDialog(window, options);
        const duration = Date.now() - startTime;
        const folderPath = result.canceled ? null : result.filePaths[0];

        log("info", "Open folder dialog completed", {
          canceled: result.canceled,
          folderPath,
          duration: `${duration}ms`,
        });

        return folderPath;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Open folder dialog failed", {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    });

    ipcMain.handle("dialog:save-file", async () => {
      const startTime = Date.now();
      log("debug", "Save file dialog request received");

      try {
        const window = this.getFocusedWindow();
        if (!window) {
          throw new Error("No focused window available for save dialog");
        }

        log("debug", "Showing save file dialog");

        const result = await dialog.showSaveDialog(window);
        const duration = Date.now() - startTime;
        const filePath = result.canceled ? null : result.filePath;

        log("info", "Save file dialog completed", {
          canceled: result.canceled,
          filePath,
          duration: `${duration}ms`,
        });

        return filePath;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Save file dialog failed", {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    });

    ipcMain.handle("dialog:multi-select", async () => {
      const startTime = Date.now();
      log("debug", "Multi-select dialog request received");

      try {
        const window = this.getFocusedWindow();
        if (!window) {
          throw new Error(
            "No focused window available for multi-select dialog"
          );
        }

        const options = {
          properties: ["openFile", "multiSelections"] as (
            | "openFile"
            | "multiSelections"
            | "openDirectory"
            | "showHiddenFiles"
            | "createDirectory"
            | "promptToCreate"
            | "noResolveAliases"
            | "treatPackageAsDirectory"
            | "dontAddToRecent"
          )[],
        };

        log("debug", "Showing multi-select dialog", options);

        const result = await dialog.showOpenDialog(window, options);
        const duration = Date.now() - startTime;
        const filePaths = result.canceled ? null : result.filePaths;

        log("info", "Multi-select dialog completed", {
          canceled: result.canceled,
          fileCount: filePaths?.length || 0,
          filePaths,
          duration: `${duration}ms`,
        });

        return filePaths;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Multi-select dialog failed", {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    });

    log("info", "All dialog handlers registered successfully", {
      handlers: [
        "show-message-box",
        "show-error-message-box",
        "dialog:open-file",
        "dialog:open-folder",
        "dialog:save-file",
        "dialog:multi-select",
      ],
    });
  }
}
