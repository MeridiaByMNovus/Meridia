"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/code/base/common/base.utils.ts
var import_path = __toESM(require("path"));
var PUBLIC_FOLDER = process.platform === "win32" ? process.env.APPDATA : import_path.default.join(process.env.HOME, ".config");
var PUBLIC_FOLDER_PATH = import_path.default.join(PUBLIC_FOLDER, "Meridia", "User");
var STORE_JSON_PATH = import_path.default.join(PUBLIC_FOLDER_PATH, "store.json");

// src/code/base/common/base.file.create.ts
var import_fs = __toESM(require("fs"));
var folders = [PUBLIC_FOLDER];
folders.forEach((folder) => {
  try {
    if (!import_fs.default.existsSync(folder)) {
      import_fs.default.mkdirSync(folder, { recursive: true });
    }
  } catch (error) {
    throw error;
  }
});
var files = { [STORE_JSON_PATH]: {} };
Object.entries(files).forEach(([filePath, defaultContent]) => {
  if (!import_fs.default.existsSync(filePath)) {
    const jsonString = JSON.stringify(defaultContent, null, 2);
    import_fs.default.writeFileSync(filePath, jsonString);
  }
});
