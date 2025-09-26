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

// src/code/base/common/base.utils.ts
var base_utils_exports = {};
__export(base_utils_exports, {
  PUBLIC_FOLDER: () => PUBLIC_FOLDER,
  PUBLIC_FOLDER_PATH: () => PUBLIC_FOLDER_PATH,
  STORE_JSON_PATH: () => STORE_JSON_PATH
});
module.exports = __toCommonJS(base_utils_exports);
var import_path = __toESM(require("path"));
var PUBLIC_FOLDER = process.platform === "win32" ? process.env.APPDATA : import_path.default.join(process.env.HOME, ".config");
var PUBLIC_FOLDER_PATH = import_path.default.join(PUBLIC_FOLDER, "Meridia", "User");
var STORE_JSON_PATH = import_path.default.join(PUBLIC_FOLDER_PATH, "store.json");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PUBLIC_FOLDER,
  PUBLIC_FOLDER_PATH,
  STORE_JSON_PATH
});
