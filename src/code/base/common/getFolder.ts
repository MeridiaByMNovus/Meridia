import fs from "fs";
import path from "path";

let currentID = 0;

export const getFolder = (dir: string) => {
  const currentFiles = fs.readdirSync(dir, { withFileTypes: true });

  return currentFiles.map((file): any => {
    const fullPath = path.join(dir, file.name);
    const id = `${++currentID}`;

    if (file.isDirectory()) {
      return {
        id,
        name: file.name,
        type: "folder",
        path: fullPath,
        containingFolderPath: dir,
        children: [],
      };
    } else {
      return {
        id,
        name: file.name,
        path: fullPath,
        containingFolderPath: dir,
        type: "file",
      };
    }
  });
};
