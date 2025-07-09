import { ipcRenderer } from "electron";
import { IFolderStructure } from "../../src/helpers/types";

export const renderer = {
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

  sendMessage: (message: string) => ipcRenderer.invoke("send-message", message),

  getMenu: () => ipcRenderer.invoke("get-menu"),

  readImageBase64: (path: string) =>
    ipcRenderer.invoke("read-image-base-64", path),
};
