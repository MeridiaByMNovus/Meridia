"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/code/base/base.preload.ts
var base_preload_exports = {};
__export(base_preload_exports, {
  filesBridge: () => filesBridge,
  fsBridge: () => fsBridge,
  ipcBridge: () => ipcBridge,
  pathBridge: () => pathBridge,
  storageBridge: () => storageBridge
});
module.exports = __toCommonJS(base_preload_exports);
var import_electron = require("electron");

// src/code/base/services/storage.service.ts
var import_fs = __toESM(require("fs"));

// src/code/workbench/common/workbench.standalone.ts
var standalones = /* @__PURE__ */ new Map();
function registerStandalone(name, standalone) {
  standalones.set(name, standalone);
}

// src/code/base/common/base.utils.ts
var import_path = __toESM(require("path"));
var PUBLIC_FOLDER = process.platform === "win32" ? process.env.APPDATA : import_path.default.join(process.env.HOME, ".config");
var PUBLIC_FOLDER_PATH = import_path.default.join(PUBLIC_FOLDER, "Meridia", "User");
var STORE_JSON_PATH = import_path.default.join(PUBLIC_FOLDER_PATH, "store.json");

// src/code/base/services/storage.service.ts
var Storage = class {
  static data;
  static {
    this.load();
  }
  static load() {
    try {
      if (import_fs.default.existsSync(STORE_JSON_PATH)) {
        const content = import_fs.default.readFileSync(STORE_JSON_PATH, "utf-8");
        this.data = JSON.parse(content);
      } else {
        this.data = {};
        this.save(this.data);
      }
    } catch {
      this.data = {};
    }
  }
  static save(data) {
    try {
      this.data = data;
      import_fs.default.writeFileSync(STORE_JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch {
    }
  }
  static get(key) {
    return this.data[key];
  }
  static store(key, value) {
    this.data[key] = value;
    this.save(this.data);
  }
  static update(key, newValue) {
    if (key in this.data) {
      this.data[key] = newValue;
      this.save(this.data);
    }
  }
  static remove(key) {
    this.data[key] = "";
    this.save(this.data);
  }
};
var _storage = new Storage();
registerStandalone("storage", _storage);

// src/code/base/base.preload.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var storage = Storage;
var storageBridge = {
  store: (_name, _value) => {
    storage.store(_name, _value);
  },
  update: (_name, _value) => {
    storage.update(_name, _value);
  },
  get: (_name) => {
    const _val = storage.get(_name);
    return _val;
  },
  remove: (_name) => {
    storage.remove(_name);
  }
};
var activeWatchers = /* @__PURE__ */ new Map();
var fsBridge = {
  readFile: (_path, encoding) => {
    return import_fs2.default.readFileSync(_path, { encoding }).toString();
  },
  deleteFile: (_path) => {
    import_fs2.default.rmSync(_path);
  },
  createFile: (_path, _content) => {
    import_fs2.default.writeFileSync(_path, _content || "");
  },
  createFolder: (_path) => {
    import_fs2.default.mkdirSync(_path, { recursive: true });
  },
  deleteFolder: (_path) => {
    import_fs2.default.rmSync(_path, { recursive: true });
  },
  watchFile: (_path, options, callback) => {
    try {
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
      import_fs2.default.watchFile(_path, options, callback);
      const watcher = import_fs2.default.watch(_path, (eventType, filename) => {
        if (eventType === "change") {
          import_fs2.default.stat(_path, (err, curr) => {
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
  unwatchFile: (_path) => {
    try {
      import_fs2.default.unwatchFile(_path);
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
    } catch (error) {
      console.error(`Failed to unwatch file ${_path}:`, error);
    }
  },
  watch: (_path, options) => {
    try {
      const watcher = import_fs2.default.watch(_path, options, (eventType, filename) => {
        console.log(`File ${filename} changed: ${eventType}`);
      });
      activeWatchers.set(_path, watcher);
      return watcher;
    } catch (error) {
      console.error(`Failed to watch ${_path}:`, error);
      throw error;
    }
  },
  unwatch: (_path) => {
    try {
      if (activeWatchers.has(_path)) {
        activeWatchers.get(_path)?.close();
        activeWatchers.delete(_path);
      }
    } catch (error) {
      console.error(`Failed to unwatch ${_path}:`, error);
    }
  },
  exists: (_path) => {
    try {
      return import_fs2.default.existsSync(_path);
    } catch {
      return false;
    }
  },
  stat: (_path) => {
    try {
      return import_fs2.default.statSync(_path);
    } catch {
      return null;
    }
  },
  readDir: (_path) => {
    try {
      return import_fs2.default.readdirSync(_path);
    } catch {
      return [];
    }
  },
  getExtension: (_path) => {
    return _path.split(".").pop()?.toLowerCase() || "";
  },
  joinPath: (...paths) => {
    return require("path").join(...paths);
  },
  dirname: (_path) => {
    return require("path").dirname(_path);
  },
  basename: (_path) => {
    return require("path").basename(_path);
  }
};
var pathBridge = {
  __dirname: () => {
    return __dirname;
  },
  dirname: (_path) => {
    return import_path2.default.dirname(_path);
  },
  basename: (_path) => {
    return import_path2.default.basename(_path);
  },
  join: (_paths) => {
    return import_path2.default.join(..._paths);
  }
};
var filesBridge = {
  openFolder: () => {
    import_electron.ipcRenderer.invoke("files-open-folder");
  },
  openChildFolder: (_path) => {
    return import_electron.ipcRenderer.invoke("files-open-child-structure", _path);
  }
};
var ipcBridge = {
  on: (channel, callback) => {
    import_electron.ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeAllListeners: (channel) => {
    import_electron.ipcRenderer.removeAllListeners(channel);
  }
};
window.addEventListener("beforeunload", () => {
  activeWatchers.forEach((watcher, path3) => {
    try {
      import_fs2.default.unwatchFile(path3);
      watcher.close();
    } catch (error) {
      console.error(`Failed to cleanup watcher for ${path3}:`, error);
    }
  });
  activeWatchers.clear();
});
import_electron.contextBridge.exposeInMainWorld("storage", storageBridge);
import_electron.contextBridge.exposeInMainWorld("fs", fsBridge);
import_electron.contextBridge.exposeInMainWorld("path", pathBridge);
import_electron.contextBridge.exposeInMainWorld("files", filesBridge);
import_electron.contextBridge.exposeInMainWorld("ipc", ipcBridge);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  filesBridge,
  fsBridge,
  ipcBridge,
  pathBridge,
  storageBridge
});
