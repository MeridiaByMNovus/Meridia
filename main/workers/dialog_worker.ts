import { ipcMain, dialog, BrowserWindow } from "electron";

export function RegisterDialogWorker() {
  ipcMain.handle("show-message-box", async (event, data) => {
    return dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      type: data.type || "info",
      title: data.title,
      message: data.content,
      buttons: data.buttons || ["OK"],
    });
  });

  ipcMain.handle("show-error-message-box", (event, data) => {
    const title =
      typeof data.title === "string"
        ? data.title
        : String(data.title ?? "Error");
    const content =
      typeof data.content === "string"
        ? data.content
        : String(data.content ?? "");
    dialog.showErrorBox(title, content);
  });

  ipcMain.handle("dialog:open-file", async () => {
    const result = await dialog.showOpenDialog(
      BrowserWindow.getFocusedWindow()!,
      {
        properties: ["openFile"],
      }
    );
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:open-folder", async () => {
    const result = await dialog.showOpenDialog(
      BrowserWindow.getFocusedWindow()!,
      {
        properties: ["openDirectory"],
      }
    );
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("dialog:save-file", async () => {
    const result = await dialog.showSaveDialog(
      BrowserWindow.getFocusedWindow()!
    );
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle("dialog:multi-select", async () => {
    const result = await dialog.showOpenDialog(
      BrowserWindow.getFocusedWindow()!,
      {
        properties: ["openFile", "multiSelections"],
      }
    );
    return result.canceled ? null : result.filePaths;
  });
}
