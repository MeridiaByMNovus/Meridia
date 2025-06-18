/*---------------------------------------------------------------------------------------------
 *  Copyright (c) MNovus. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IMainContext } from "./types";
import React from "react";

export const MainContext = React.createContext({} as IMainContext);

export const get_file_types = (file_name: string) => {
  const fileTypes = {
    ".gitignore": "ignore",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".go": "go",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kotlin": "kotlin",
    ".dart": "dart",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".xls": "excel",
    ".xlsx": "excel",
    ".csv": "csv",
  };
  return fileTypes[
    Object.keys(fileTypes).filter((type) =>
      new RegExp(`${type}$`).test(file_name)
    )[0] as keyof typeof fileTypes
  ];
};

export const path_join = (args: string[]) => {
  const os = /linux|macintosh|windows/i
    .exec(window.navigator.userAgent)[0]
    .toLowerCase();
  return os == "windows" ? args.join("\\") : args.join("/");
};
