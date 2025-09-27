// This module is the CJS entry point for the library.

// The Rust addon.
import * as addon from "./load.cjs";

// Use this declaration to assign types to the addon's exports,
// which otherwise by default are `any`.
declare module "./load.cjs" {
  function walkdir(options: WalkdirOptions): IFolderStructure;
}

export interface IFolderStructure {
  name: string;
  uri: string;
  type: "folder" | "file";
  isRoot: boolean;
  children: IFolderStructure[];
}

export interface WalkdirOptions {
  dir_path: string;
  level?: number;
}

export function walkdir(dirPath: string, level?: number): IFolderStructure {
  const options: WalkdirOptions = {
    dir_path: dirPath,
    level: level,
  };
  return addon.walkdir(options);
}
