import { ipcMain, dialog } from "electron";
import { IFolderStructure } from "../../workbench/workbench.types.js";
import { Storage } from "../services/storage.service.js";
import fs from "fs";
import path from "path";
import { mainWindow } from "../../../main.js";
import { startFileWatcher } from "./watcher.node.js";

export async function getFolderContent(
  _path: string
): Promise<IFolderStructure[]> {
  const items = fs.readdirSync(_path, { withFileTypes: true });

  const content = await Promise.all(
    items.map(async (item): Promise<IFolderStructure> => {
      const fullPath = path.join(_path, item.name);

      return {
        name: item.name,
        uri: fullPath,
        type: item.isDirectory() ? ("folder" as const) : ("file" as const),
        children: item.isDirectory() ? [] : [],
        isRoot: false,
      };
    })
  );

  content.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "folder" ? -1 : 1;
  });

  return content;
}

function updateFolderStructure(
  structure: IFolderStructure,
  targetUri: string,
  newChildren: IFolderStructure[]
): IFolderStructure {
  if (structure.uri === targetUri) {
    return {
      ...structure,
      children: newChildren,
    };
  }

  if (structure.children && structure.children.length > 0) {
    return {
      ...structure,
      children: structure.children.map((child) =>
        updateFolderStructure(child, targetUri, newChildren)
      ),
    };
  }

  return structure;
}

async function refreshRootFolder(): Promise<void> {
  try {
    const currentStructure = Storage.get("files-structure") as IFolderStructure;

    if (!currentStructure || !currentStructure.isRoot) {
      return;
    }

    if (!fs.existsSync(currentStructure.uri)) {
      Storage.store("files-structure", null);
      return;
    }

    const updatedChildren = await getFolderContent(currentStructure.uri);

    const refreshedStructure: IFolderStructure = {
      ...currentStructure,
      children: updatedChildren,
    };

    Storage.store("files-structure", refreshedStructure);
  } catch (error) {}
}

ipcMain.handle("files-open-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }

  const _path = result.filePaths[0]!;

  const _structure: IFolderStructure = {
    name: path.basename(_path),
    uri: _path,
    isRoot: true,
    type: "folder" as const,
    children: await getFolderContent(_path),
  };

  Storage.store("files-structure", _structure);
  startFileWatcher(_path);

  mainWindow.webContents.reload();
});

ipcMain.handle(
  "files-open-child-structure",
  async (event, folderUri: string) => {
    try {
      const currentStructure = Storage.get(
        "files-structure"
      ) as IFolderStructure;

      if (!currentStructure) {
        return { success: false, error: "No structure found" };
      }

      const folderContent = await getFolderContent(folderUri);

      const updatedStructure = updateFolderStructure(
        currentStructure,
        folderUri,
        folderContent
      );

      Storage.store("files-structure", updatedStructure);

      return { success: true, structure: updatedStructure };
    } catch (error) {
      return { success: false, error: error };
    }
  }
);

function getRootFolderPath(): string | null {
  const currentStructure = Storage.get("files-structure") as IFolderStructure;

  if (!currentStructure || !currentStructure.isRoot) {
    return null;
  }

  return currentStructure.uri;
}

async function initializeOnStartup(): Promise<void> {
  await refreshRootFolder();

  const rootPath = getRootFolderPath();
  if (rootPath) {
    startFileWatcher(rootPath);
  }
}

initializeOnStartup();
