import fs from "fs";
import path from "path";
import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import { PythonShell } from "python-shell";
import { contextBridge, ipcRenderer } from "electron";
import { Storage } from "./services/storage.service.js";
import { FetchCompletionItemParams } from "../platform/mira/mira.suggestions/types/internal.js";

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
  readFileBuffer: (_path: string, encoding?: fs.EncodingOption) => {
    return fs.readFileSync(_path, { encoding: encoding as any });
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
    fs.rmSync(_path, { recursive: true, force: true });
  },
  rename: (_path: string, _new: string) => {
    fs.renameSync(_path, _new);
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
    } catch (error) {}
  },

  watch: (_path: string, options?: any) => {
    try {
      const watcher = fs.watch(_path, options, (eventType, filename) => {});

      activeWatchers.set(_path, watcher);
      return watcher;
    } catch (error) {
      throw error;
    }
  },

  unwatch: (_path: string) => {
    try {
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
    } catch (error) {}
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
  __dirname: __dirname,
  dirname: (_path: string) => {
    return path.dirname(_path);
  },
  basename: (_path: string) => {
    return path.basename(_path);
  },
  resolve: (_path: string[]) => {
    return path.resolve(..._path);
  },
  join: (_paths: string[]) => {
    return path.join(..._paths);
  },
  sep: path.sep,
  isAbsolute: (_path: string) => {
    return path.isAbsolute(_path);
  },
  normalize: (_path: string) => {
    return path.normalize(_path)
  }
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
  send: (channel: any, ...args: any) => ipcRenderer.send(channel, ...args),

  invoke: async (channel: any, ...args: any) => {
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (e) {
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

export const miraBridge = {
  requestCompletion: (params: FetchCompletionItemParams) => {
    return ipcRenderer.invoke("mira-completion-request", params);
  },
};

export const pythonBridge = {
  executeScript: (
    scriptPath: string,
    args: string[] = []
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const options = {
        ...PythonShell.defaultOptions,
        args: args,
      };

      const logs: string[] = [];
      const pyshell = new PythonShell(scriptPath, options);

      pyshell.on("message", (message) => {
        logs.push(message);
      });

      pyshell.on("error", (err) => {
        reject(err);
      });

      pyshell.end((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(logs);
        }
      });
    });
  },

  createStreamingShell: (scriptPath: string, args: string[] = []) => {
    const options = {
      mode: "text" as const,
      pythonOptions: ["-u"],
      args: args,
    };

    const pyshell = new PythonShell(scriptPath, options);

    return {
      shell: pyshell,
      onMessage: (callback: (message: string) => void) => {
        pyshell.on("message", callback);
      },
      onError: (callback: (error: Error) => void) => {
        pyshell.on("error", callback);
      },
      onClose: (callback: () => void) => {
        pyshell.on("close", callback);
      },
      terminate: () => {
        pyshell.terminate();
      },
      kill: () => {
        pyshell.kill();
      },
      send: (message: string) => {
        pyshell.send(message);
      },
    };
  },
};

export const childprocessBridge = {};

export const spawnBridge = {
  spawn: (
    command: string,
    args: string[] = [],
    options: SpawnOptionsWithoutStdio = {}
  ) => {
    return spawn(command, args, options);
  },
};

export const editorBridge = {
  getFsSuggestions: (currentPath: string) => {
    try {
      const resolvedPath = path.resolve(currentPath || ".");
      const items = fs.readdirSync(resolvedPath, { withFileTypes: true });

      return items.map((item) => ({
        name: item.name,
        isDirectory: item.isDirectory(),
        path: path.join(resolvedPath, item.name),
      }));
    } catch (error) {
      console.error("Error reading directory:", error);
      return [];
    }
  },
};

window.addEventListener("beforeunload", () => {
  activeWatchers.forEach((watcher, path) => {
    try {
      fs.unwatchFile(path);
      watcher.close();
    } catch (error) {}
  });
  activeWatchers.clear();
});

contextBridge.exposeInMainWorld("storage", storageBridge);
contextBridge.exposeInMainWorld("fs", fsBridge);
contextBridge.exposeInMainWorld("path", pathBridge);
contextBridge.exposeInMainWorld("files", filesBridge);
contextBridge.exposeInMainWorld("ipc", ipcBridge);
contextBridge.exposeInMainWorld("mira", miraBridge);
contextBridge.exposeInMainWorld("python", pythonBridge);
contextBridge.exposeInMainWorld("childprocess", childprocessBridge);
contextBridge.exposeInMainWorld("spawn", spawnBridge);
contextBridge.exposeInMainWorld("editor", editorBridge);
