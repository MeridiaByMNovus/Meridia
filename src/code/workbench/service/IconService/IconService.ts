import { FileExtensions1ToIcon } from "./fileExtensions1.js";
import { FileExtensions2ToIcon } from "./fileExtensions2.js";
import { FileNamesToIcon } from "./fileNamesToIcon.js";
import { LanguagesToIcon } from "./languagesToIcon.js";

export const DEFAULT_FOLDER = "default_folder.svg";
export const DEFAULT_FOLDER_OPENED = "default_folder_opened.svg";
export const DEFAULT_ROOT = "default_root_folder.svg";
export const DEFAULT_ROOT_OPENED = "default_root_folder_opened.svg";
export const DEFAULT_FILE = "default_file.svg";

let prevExtension: undefined | string = undefined;
let prevIcon: undefined | string = undefined;

export function getIconForFile(fileName: string) {
  // match by exact FileName
  const iconFromFileName = FileNamesToIcon[fileName];
  if (iconFromFileName !== undefined) {
    return iconFromFileName;
  }

  // match by File Extension
  const extensions = fileName.split(".");
  if (extensions.length > 2) {
    const ext1 = extensions.pop();
    const ext2 = extensions.pop();
    // check for `.js.map`, `test.tsx`, ...
    const iconFromExtension2 = FileExtensions2ToIcon[`${ext2}.${ext1}`];
    if (iconFromExtension2 !== undefined) {
      return iconFromExtension2;
    }
    // check for `.js`, `tsx`, ...
    if (!ext1) {
      // If there's no extension, return DEFAULT_ICON
      return DEFAULT_FILE;
    }
    if (ext1 === prevExtension) {
      return prevIcon;
    }
    const iconFromExtension1 = FileExtensions1ToIcon[ext1];
    if (iconFromExtension1 !== undefined) {
      // memoization
      prevExtension = ext1;
      prevIcon = iconFromExtension1;
      return iconFromExtension1;
    }
  } else {
    const ext = extensions.pop();
    if (!ext) {
      // If there's no extension, return DEFAULT_ICON
      return DEFAULT_FILE;
    }
    if (ext === prevExtension) {
      return prevIcon;
    }
    const iconFromExtension = FileExtensions1ToIcon[ext];
    if (iconFromExtension !== undefined) {
      // memoization
      prevExtension = ext;
      prevIcon = iconFromExtension;
      return iconFromExtension;
    }
  }

  // match by language
  const fileExtension = fileName.split(".").pop();
  if (fileExtension !== undefined) {
    const iconFromLang = LanguagesToIcon[fileExtension];
    if (iconFromLang) {
      return iconFromLang;
    }
  }

  // if there's no icon for file, use default one
  return DEFAULT_FILE;
}
