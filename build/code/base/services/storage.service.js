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

// src/code/base/services/storage.service.ts
var storage_service_exports = {};
__export(storage_service_exports, {
  Storage: () => Storage
});
module.exports = __toCommonJS(storage_service_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Storage
});
