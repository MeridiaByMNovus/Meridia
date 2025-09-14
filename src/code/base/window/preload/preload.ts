import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import dotenv from "dotenv";
import { contextBridge, ipcRenderer } from "electron";
import { PythonShell } from "python-shell";
import { IFolderStructure } from "../../../../typings/types.js";
import { FetchCompletionItemParams } from "../../../platform/MeridiaAssist/types/internal.js";
import { assist } from "../../common/assist.js";

dotenv.config();

export const filesystem = {
  readFileSync: (filePath: string, encoding: BufferEncoding) =>
    fs.readFileSync(filePath, { encoding: encoding }),
  writeFileSync: (filePath: string, data: string, encoding?: BufferEncoding) =>
    fs.writeFileSync(filePath, data, { encoding: encoding }),
  existsSync: (filePath: string) => fs.existsSync(filePath),
  readdirSync: (dirPath: string) => fs.readdirSync(dirPath),

  isDirectory: (dirPath: string) =>
    fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
  mkdirSync: (dirPath: string, options?: fs.MakeDirectoryOptions) =>
    fs.mkdirSync(dirPath, options),
  rmSync: (filePath: string, options?: fs.RmOptions) =>
    fs.rmSync(filePath, options),

  statSync: (filePath: string) => fs.statSync(filePath),

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
};

export const pathBridge = {
  resolve: (...args: string[]) => path.resolve(...args),
  dirname: (p: string) => path.dirname(p),
  basename: (p: string) => path.basename(p),
  extname: (p: string) => path.extname(p),
  join: (...args: string[]) => path.join(...args),
  normalize: (p: string) => path.normalize(p),
  relative: (from: string, to: string) => path.relative(from, to),
  parse: (p: string) => path.parse(p),
  format: (pathObject: path.FormatInputPathObject) => path.format(pathObject),
  isAbsolute: (p: string) => path.isAbsolute(p),
  sep: path.sep,
  delimiter: path.delimiter,
  __dirname: () => __dirname,
};

export const folderBridge = {
  openFolder: () => ipcRenderer.invoke("open-folder"),
  get_folder: () => ipcRenderer.invoke("get-folder"),
  open_set_folder: () => ipcRenderer.invoke("open-set-folder"),
  clear_folder: () => ipcRenderer.send("clear-folder"),
  set_folder: (folder: string) => ipcRenderer.send("set-folder", folder),
  set_folder_structure: (structure: IFolderStructure) =>
    ipcRenderer.send("set-folder-structure", structure),
  reload_window: (folder: string) => ipcRenderer.send("refresh-window", folder),
};

export const windowManagerBridge = {
  close: () => ipcRenderer.invoke("close"),
  minimize: () => ipcRenderer.invoke("minimize"),
  maximize: () => ipcRenderer.invoke("maximize"),
  restore: () => ipcRenderer.invoke("restore"),
  focus: () => ipcRenderer.invoke("focus"),
  blur: () => ipcRenderer.invoke("blur"),
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  isMinimized: () => ipcRenderer.invoke("is-minimized"),
  isFullScreen: () => ipcRenderer.invoke("is-fullscreen"),
};

export const menuBridge = {
  getMenu: () => ipcRenderer.invoke("get-menu"),
  handleMenuClick: (menuId: any) => ipcRenderer.invoke("menu-click", menuId),
  showContextMenu: (template: any) =>
    ipcRenderer.invoke("show-context-menu", template),
};

export const dialogBridge = {
  showDialog: (data: {
    type: string;
    title: string;
    content: string;
    buttons?: any[];
  }) => ipcRenderer.invoke("show-message-box", data),

  showError: (data: { title: string; content: string }) =>
    ipcRenderer.invoke("show-error-message-box", data),

  showWarning: (data: { title: string; content: string }) =>
    ipcRenderer.invoke("show-warning-message-box", data),

  showInfo: (data: { title: string; content: string }) =>
    ipcRenderer.invoke("show-info-message-box", data),

  showOpenDialog: (options: any) =>
    ipcRenderer.invoke("show-open-dialog", options),

  showSaveDialog: (options: any) =>
    ipcRenderer.invoke("show-save-dialog", options),
};

export const pythonBridge = {
  executeScript: async (scriptPath: string, args: string[] = []) => {
    try {
      const options = {
        ...PythonShell.defaultOptions,
        args: args,
      };
      const result = await PythonShell.run(scriptPath, options);
      return result;
    } catch (error) {
      console.error("Python script execution error:", error);
      throw error;
    }
  },

  executeText: async (script: string) => {
    try {
      const result = await PythonShell.runString(
        script,
        PythonShell.defaultOptions
      );
      return result;
    } catch (error) {
      console.error("Python text execution error:", error);
      throw error;
    }
  },

  createTempPythonFile: async () => {
    return (await ipcRenderer.invoke("create-temp-file")) as {
      path: string;
      name: string;
    };
  },

  getVersion: async () => await ipcRenderer.invoke("get-python-version"),

  getPythonPath: () => {
    return PythonShell.defaultPythonPath;
  },

  installPackage: async (packageName: string) =>
    await ipcRenderer.invoke("install-python-package", packageName),
};

export const watchBridge = {
  watchFile: (
    filePath: string,
    callback?: (eventType: string, filename: string) => void
  ) => {
    const watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true,
    });

    if (callback) {
      watcher.on("all", callback);
    }

    return {
      close: () => watcher.close(),
      add: (paths: string | string[]) => watcher.add(paths),
      unwatch: (paths: string | string[]) => watcher.unwatch(paths),
    };
  },

  watchFolder: (
    folderPath: string,
    callback?: (eventType: string, path: string) => void
  ) => {
    const watcher = chokidar.watch(folderPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../,
    });

    if (callback) {
      watcher.on("all", callback);
    }

    return {
      close: () => watcher.close(),
      add: (paths: string | string[]) => watcher.add(paths),
      unwatch: (paths: string | string[]) => watcher.unwatch(paths),
    };
  },
};

export const ipcBridge = {
  send: (channel: any, ...args: any[]) => ipcRenderer.send(channel, ...args),

  invoke: async (channel: any, data: any) => {
    try {
      return await ipcRenderer.invoke(channel, data);
    } catch (e) {
      dialogBridge.showError({ title: "Error", content: e });
      return false;
    }
  },

  on: (channel: any, func: any) =>
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),

  once: (channel: any, func: any) =>
    ipcRenderer.once(channel, (event, ...args) => func(event, ...args)),

  removeAllListeners: (channel: any) => ipcRenderer.removeAllListeners(channel),

  removeListener: (channel: any, listener: any) =>
    ipcRenderer.removeListener(channel, listener),
};

export const systemBridge = {
  platform: () => process.platform,
  arch: () => process.arch,
  version: () => process.version,
  getEnv: (key: string) => process.env[key],
  getCwd: () => process.cwd(),
  getHomeDir: () => require("os").homedir(),
  getTempDir: () => require("os").tmpdir(),
  getUserInfo: () => require("os").userInfo(),
};

export const utilsBridge = {
  uuid: () => require("crypto").randomUUID(),
  hash: (data: string, algorithm: string = "sha256") =>
    require("crypto").createHash(algorithm).update(data).digest("hex"),
  base64Encode: (data: string) => Buffer.from(data).toString("base64"),
  base64Decode: (data: string) => Buffer.from(data, "base64").toString(),
  timestamp: () => Date.now(),
  formatDate: (date: Date, format: string) => {
    return date.toLocaleDateString();
  },
};

export const geminiBridge = {
  getApiKey: () => {
    return process.env.GEMINI_API as string;
  },
};

export const assistBridge = {
  invokeCompletionRequest: async (params: FetchCompletionItemParams) => {
    const body = params.body;

    const completion = await assist.complete({
      body,
    });

    return completion;
  },
};

ipcRenderer.on("command-update-folder-structure", (event, data) => {
  event.sender.send("folder-updated", data.updatedData);
});

contextBridge.exposeInMainWorld("filesystem", filesystem);
contextBridge.exposeInMainWorld("path", pathBridge);
contextBridge.exposeInMainWorld("folder", folderBridge);
contextBridge.exposeInMainWorld("windowmanager", windowManagerBridge);
contextBridge.exposeInMainWorld("menu", menuBridge);
contextBridge.exposeInMainWorld("dialog", dialogBridge);
contextBridge.exposeInMainWorld("python", pythonBridge);
contextBridge.exposeInMainWorld("watch", watchBridge);
contextBridge.exposeInMainWorld("ipc", ipcBridge);
contextBridge.exposeInMainWorld("system", systemBridge);
contextBridge.exposeInMainWorld("utils", utilsBridge);
contextBridge.exposeInMainWorld("gemini", geminiBridge);
contextBridge.exposeInMainWorld("assist", assistBridge);
