import { FileExtensions1ToIcon } from "./fileExtensions1.js";
import { FileExtensions2ToIcon } from "./fileExtensions2.js";
import { FileNamesToIcon } from "./fileNamesToIcon.js";
import { LanguagesToIcon } from "./languagesToIcon.js";

export const DEFAULT_FILE = "default_file.svg";

let prevExtension: undefined | string = undefined;
let prevIcon: undefined | string = undefined;

export function getIconForFile(fileName: string) {
  const iconFromFileName = FileNamesToIcon[fileName];
  if (iconFromFileName !== undefined) {
    return iconFromFileName;
  }

  const extensions = fileName.split(".");
  if (extensions.length > 2) {
    const ext1 = extensions.pop();
    const ext2 = extensions.pop();

    const iconFromExtension2 = FileExtensions2ToIcon[`${ext2}.${ext1}`];
    if (iconFromExtension2 !== undefined) {
      return iconFromExtension2;
    }

    if (!ext1) {
      return DEFAULT_FILE;
    }
    if (ext1 === prevExtension) {
      return prevIcon;
    }
    const iconFromExtension1 = FileExtensions1ToIcon[ext1];
    if (iconFromExtension1 !== undefined) {
      prevExtension = ext1;
      prevIcon = iconFromExtension1;
      return iconFromExtension1;
    }
  } else {
    const ext = extensions.pop();
    if (!ext) {
      return DEFAULT_FILE;
    }
    if (ext === prevExtension) {
      return prevIcon;
    }
    const iconFromExtension = FileExtensions1ToIcon[ext];
    if (iconFromExtension !== undefined) {
      prevExtension = ext;
      prevIcon = iconFromExtension;
      return iconFromExtension;
    }
  }

  const fileExtension = fileName.split(".").pop();
  if (fileExtension !== undefined) {
    const iconFromLang = LanguagesToIcon[fileExtension];
    if (iconFromLang) {
      return iconFromLang;
    }
  }

  return DEFAULT_FILE;
}
