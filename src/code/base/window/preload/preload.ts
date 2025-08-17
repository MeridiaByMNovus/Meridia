import path from "path";
import fs from "fs";
import { contextBridge, ipcRenderer } from "electron";
import { IFolderStructure } from "../../../../typings/types.js";

export const ERenderer = {
  openFolder: () => ipcRenderer.invoke("open-folder"),
  get_folder: () => ipcRenderer.invoke("get-folder"),
  open_set_folder: () => ipcRenderer.invoke("open-set-folder"),
  clear_folder: () => ipcRenderer.send("clear-folder"),

  get_file_content: async (path: string) => {
    try {
      return await ipcRenderer.invoke("get-file-content", path);
    } catch {
      return "error fetching file content";
    }
  },

  save_file: (data: { path: string; content: string }) =>
    ipcRenderer.send("save-file", data),

  create_file: (data: { path: string; fileName: string; rootPath: string }) =>
    ipcRenderer.send("create-file", data),

  create_folder: (data: { path: string; fileName: string; rootPath: string }) =>
    ipcRenderer.send("create-folder", data),

  set_folder: (folder: string) => ipcRenderer.send("set-folder", folder),

  set_folder_structure: (structure: IFolderStructure) =>
    ipcRenderer.send("set-folder-structure", structure),

  reload_window: (folder: string) => ipcRenderer.send("refresh-window", folder),

  delete_file: (data: { path: string; rootPath: string }) =>
    ipcRenderer.send("delete-file", data),

  delete_folder: (data: { path: string; rootPath: string }) =>
    ipcRenderer.send("delete-folder", data),

  rename: (data: {
    newName: string;
    path: string;
    rootPath: string;
    containingFolder: string;
  }) => ipcRenderer.send("rename", data),

  ipcRenderer: {
    send: (channel: any, ...args: any[]) => ipcRenderer.send(channel, ...args),

    invoke: async (channel: any, data: any) => {
      try {
        return await ipcRenderer.invoke(channel, data);
      } catch (e) {
        ipcRenderer.invoke("show-error-message-box", {
          title: "Error",
          content: e instanceof Error ? e.message : String(e),
        });
        return false;
      }
    },

    on: (channel: any, func: any) =>
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),

    once: (channel: any, func: any) =>
      ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),

    removeAllListeners: (channel: any) =>
      ipcRenderer.removeAllListeners(channel),

    removeListener: (channel: any, listener: any) =>
      ipcRenderer.removeListener(channel, listener),
  },

  getMenu: () => ipcRenderer.invoke("get-menu"),

  handleMenuClick: (menuId: any) => ipcRenderer.invoke("menu-click", menuId),

  handleWindowClose: () => ipcRenderer.invoke("close"),
  handleWindowMinimize: () => ipcRenderer.invoke("minimize"),
  handleWindowMaximize: () => ipcRenderer.invoke("maximize"),
  handleWindowRestore: () => ipcRenderer.invoke("restore"),

  createTempPythonFile: async () => {
    return (await ipcRenderer.invoke("create-temp-file")) as {
      path: string;
      name: string;
    };
  },

  readFile: async (path: string) => {
    return await ipcRenderer.invoke("read-file", path);
  },
};

ipcRenderer.on("command-update-folder-structure", (event, data) => {
  event.sender.send("folder-updated", data.updatedData);
});

export const fsBridge = {
  readFileSync: (filePath: string, encoding: BufferEncoding) =>
    fs.readFileSync(filePath, { encoding: encoding }),
  writeFileSync: (filePath: string, data: string, encoding?: BufferEncoding) =>
    fs.writeFileSync(filePath, data, { encoding: encoding }),
  existsSync: (filePath: string) => fs.existsSync(filePath),
  readdirSync: (dirPath: string) => fs.readdirSync(dirPath),
  isDirectory: (dirPath: string) =>
    fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
};

export const pathBridge = {
  resolve: (...args: string[]) => path.resolve(...args),
  dirname: (p: string) => path.dirname(p),
  join: (...args: string[]) => path.join(...args),
  __dirname: () => {
    return __dirname;
  },
};

contextBridge.exposeInMainWorld("fsBridge", fsBridge);
contextBridge.exposeInMainWorld("pathBridge", pathBridge);
contextBridge.exposeInMainWorld("electron", ERenderer);
