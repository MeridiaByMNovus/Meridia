import { IpcRenderer, ipcRenderer } from "electron";

import {
  IEditorSettings,
  IFolderStructure,
  IUIState,
} from "../../src/helpers/types";

export const renderer = {
  openFolder: async () => {
    const folder = await ipcRenderer.invoke("open-folder");
    return folder;
  },

  get_folder: async () => {
    const folder = await ipcRenderer.invoke("get-folder");
    return folder;
  },

  open_set_folder: async () => {
    const folder = await ipcRenderer.invoke("open-set-folder");
    return folder;
  },

  clear_folder: () => {
    ipcRenderer.send("clear-folder");
  },

  get_settings: async () => {
    const settings = await ipcRenderer.invoke("get-settings");
    return settings;
  },
  clear_settings: () => {
    ipcRenderer.send("clear-settings");
  },

  set_settings: (settings: IEditorSettings) => {
    ipcRenderer.send("set-settings", settings);
  },

  get_ui_state: async () => {
    const state = await ipcRenderer.invoke("get-ui-state");
    return state;
  },
  clear_ui_state: () => {
    ipcRenderer.send("clear-ui-state");
  },

  set_ui_state: (state: IUIState) => {
    ipcRenderer.send("set-ui-state", state);
  },

  clear_ui: () => {
    ipcRenderer.send("clear-ui");
  },

  get_file_content: async (path: string) => {
    try {
      const file_content = await ipcRenderer.invoke("get-file-content", path);
      return file_content;
    } catch {
      return "error fetching file content";
    }
  },

  save_file: (data: { path: string; content: string }) => {
    ipcRenderer.send("save-file", data);
  },

  show_contextmenu: (data: {
    path: string;
    type: "folder" | "file";
    rootPath: string;
  }) => {
    const response = ipcRenderer.send("folder-contextmenu", data);
  },
  varinfo_contextmenu: (data: { name: string; path: string }) => {
    const response = ipcRenderer.send("datavarinfotitle-contextmenu", data);
  },

  create_file: (data: { path: string; fileName: string; rootPath: string }) => {
    ipcRenderer.send("create-file", data);
  },
  create_folder: (data: {
    path: string;
    fileName: string;
    rootPath: string;
  }) => {
    ipcRenderer.send("create-folder", data);
  },

  set_folder: (folder: string) => {
    ipcRenderer.send("set-folder", folder);
  },

  set_folder_structure: (structure: IFolderStructure) => {
    ipcRenderer.send("set-folder-structure", structure);
  },

  reload_window: (folder: string) => {
    ipcRenderer.send("refresh-window", folder);
  },

  delete_file: (data: { path: string; rootPath: string }) => {
    ipcRenderer.send("delete-file", data);
  },

  delete_folder: (data: { path: string; rootPath: string }) => {
    ipcRenderer.send("delete-folder", data);
  },

  rename: (data: {
    newName: string;
    path: string;
    rootPath: string;
    containingFolder: string;
  }) => {
    ipcRenderer.send("rename", data);
  },

  ipcRenderer: {
    send: (channel: any, data: any) => {
      ipcRenderer.send(channel, data);
    },
    invoke: (channel: any, data: any) => {
      ipcRenderer.invoke(channel, data).catch((e: any) => {
        ipcRenderer.invoke("show-error-message-box", {
          title: "Error",
          content: e instanceof Error ? e.message : String(e),
        });
      });
    },
    on: (channel: any, func: any) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    once: (channel: any, func: any) => {
      ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
    },
    removeAllListeners: (channel: any) => {
      ipcRenderer.removeAllListeners(channel);
    },
    removeListener: (channel: any, listener: any) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },

  get_data_studio_variables: async () => {
    const vars = await ipcRenderer.invoke("get-data-studio-variables");
    return vars;
  },

  set_data_studio_variables: async (vars: any[]) => {
    ipcRenderer.send("set-data-studio-variables", vars);
  },

  show_tools: () => {
    ipcRenderer.invoke("show-tools");
  },
  hide_tools: () => {
    ipcRenderer.invoke("hide-tools");
  },
  sendMessage: (message: string) => ipcRenderer.invoke("send-message", message),
  getMenu: () => ipcRenderer.invoke("get-menu"),
};
