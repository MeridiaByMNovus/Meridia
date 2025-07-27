import { ipcMain, dialog, BrowserWindow } from "electron";

export class DialogService {
  constructor() {
    this.registerHandlers();
  }

  private getFocusedWindow() {
    return BrowserWindow.getFocusedWindow()!;
  }

  private registerHandlers() {
    ipcMain.handle("show-message-box", async (_, data) => {
      return dialog.showMessageBox(this.getFocusedWindow(), {
        type: data.info || "info",
        title: data.title,
        message: data.content,
        buttons: data.buttons || ["OK"],
      });
    });

    ipcMain.handle("show-error-message-box", (_, data) => {
      const title =
        typeof data.title === "string"
          ? data.title
          : String(data.title ?? "Error");
      const content =
        typeof data.content === "string"
          ? data.content
          : String(data.content ?? "");
      return dialog.showErrorBox(title, content);
    });

    ipcMain.handle("dialog:open-file", async (_, ext?: string[]) => {
      const result = await dialog.showOpenDialog(this.getFocusedWindow(), {
        properties: ["openFile"],
        filters: ext ? [{ name: "Allowed Files", extensions: ext }] : [],
      });
      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("dialog:open-folder", async () => {
      const result = await dialog.showOpenDialog(this.getFocusedWindow(), {
        properties: ["openDirectory"],
      });
      return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle("dialog:save-file", async () => {
      const result = await dialog.showSaveDialog(this.getFocusedWindow());
      return result.canceled ? null : result.filePath;
    });

    ipcMain.handle("dialog:multi-select", async () => {
      const result = await dialog.showOpenDialog(this.getFocusedWindow(), {
        properties: ["openFile", "multiSelections"],
      });
      return result.canceled ? null : result.filePaths;
    });
  }
}
