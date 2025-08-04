import fs from "fs";
import path from "path";

let currentID = 0;

export const getFolder = (dir: string) => {
  let currentFiles: fs.Dirent[];

  try {
    currentFiles = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return [
      {
        id: `${++currentID}`,
        name: path.basename(dir),
        path: dir,
        type: "folder",
        containingFolderPath: path.dirname(dir),
        error: `Could not read directory: ${(err as Error).message}`,
        children: [],
      },
    ];
  }

  return currentFiles.map((file): any => {
    const fullPath = path.join(dir, file.name);
    const id = `${++currentID}`;

    try {
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
    } catch (err) {
      return {
        id,
        name: file.name,
        path: fullPath,
        containingFolderPath: dir,
        type: "unknown",
        error: `Could not access: ${(err as Error).message}`,
      };
    }
  });
};
