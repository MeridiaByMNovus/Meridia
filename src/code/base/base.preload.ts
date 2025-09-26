import { contextBridge, ipcRenderer } from "electron";
import { Storage } from "./services/storage.service";
import fs from "fs";
import path from "path";

const storage = Storage;

export const storageBridge = {
  store: (_name: string, _value: any) => {
    storage.store(_name, _value);
  },
  update: (_name: string, _value: any) => {
    storage.update(_name, _value);
  },
  get: (_name: string) => {
    const _val = storage.get(_name);
    return _val;
  },
  remove: (_name: string) => {
    storage.remove(_name);
  },
};

const activeWatchers = new Map<string, fs.FSWatcher>();

export const fsBridge = {
  readFile: (_path: string, encoding?: fs.EncodingOption) => {
    return fs.readFileSync(_path, { encoding: encoding as any }).toString();
  },
  deleteFile: (_path: string) => {
    fs.rmSync(_path);
  },
  createFile: (_path: string, _content?: string) => {
    fs.writeFileSync(_path, _content || "");
  },
  createFolder: (_path: string) => {
    fs.mkdirSync(_path, { recursive: true });
  },
  deleteFolder: (_path: string) => {
    fs.rmSync(_path, { recursive: true });
  },

  watchFile: (
    _path: string,
    options: any,
    callback: (curr: fs.Stats, prev: fs.Stats) => void
  ) => {
    try {
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }

      fs.watchFile(_path, options, callback);

      const watcher = fs.watch(_path, (eventType, filename) => {
        if (eventType === "change") {
          fs.stat(_path, (err, curr) => {
            if (!err) {
              const prev = curr;
              callback(curr, prev);
            }
          });
        }
      });

      activeWatchers.set(_path, watcher);

      return watcher;
    } catch (error) {
      console.error(`Failed to watch file ${_path}:`, error);
      throw error;
    }
  },

  unwatchFile: (_path: string) => {
    try {
      fs.unwatchFile(_path);

      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
    } catch (error) {
      console.error(`Failed to unwatch file ${_path}:`, error);
    }
  },

  watch: (_path: string, options?: any) => {
    try {
      const watcher = fs.watch(_path, options, (eventType, filename) => {
        console.log(`File ${filename} changed: ${eventType}`);
      });

      activeWatchers.set(_path, watcher);
      return watcher;
    } catch (error) {
      console.error(`Failed to watch ${_path}:`, error);
      throw error;
    }
  },

  unwatch: (_path: string) => {
    try {
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
    } catch (error) {
      console.error(`Failed to unwatch ${_path}:`, error);
    }
  },

  exists: (_path: string): boolean => {
    try {
      return fs.existsSync(_path);
    } catch {
      return false;
    }
  },

  stat: (_path: string): fs.Stats | null => {
    try {
      return fs.statSync(_path);
    } catch {
      return null;
    }
  },

  readDir: (_path: string): string[] => {
    try {
      return fs.readdirSync(_path);
    } catch {
      return [];
    }
  },

  getExtension: (_path: string): string => {
    return _path.split(".").pop()?.toLowerCase() || "";
  },

  joinPath: (...paths: string[]): string => {
    return require("path").join(...paths);
  },

  dirname: (_path: string): string => {
    return require("path").dirname(_path);
  },

  basename: (_path: string): string => {
    return require("path").basename(_path);
  },
};

export const pathBridge = {
  __dirname: () => {
    return __dirname;
  },
  dirname: (_path: string) => {
    return path.dirname(_path);
  },
  basename: (_path: string) => {
    return path.basename(_path);
  },
  join: (_paths: string[]) => {
    return path.join(..._paths);
  },
};

export const filesBridge = {
  openFolder: () => {
    ipcRenderer.invoke("files-open-folder");
  },
  openChildFolder: (_path: string) => {
    return ipcRenderer.invoke("files-open-child-structure", _path);
  },
};

export const ipcBridge = {
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
};

window.addEventListener("beforeunload", () => {
  activeWatchers.forEach((watcher, path) => {
    try {
      fs.unwatchFile(path);
      watcher.close();
    } catch (error) {
      console.error(`Failed to cleanup watcher for ${path}:`, error);
    }
  });
  activeWatchers.clear();
});

contextBridge.exposeInMainWorld("storage", storageBridge);
contextBridge.exposeInMainWorld("fs", fsBridge);
contextBridge.exposeInMainWorld("path", pathBridge);
contextBridge.exposeInMainWorld("files", filesBridge);
contextBridge.exposeInMainWorld("ipc", ipcBridge);
