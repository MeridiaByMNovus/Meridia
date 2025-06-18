/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-useless-escape */
import { mainWindow } from "..";
import { registerIpcMainCommand } from "./command_worker";
import { StorageWorker } from "./storage_worker";
import { IFolderStructure, TFolderTree } from "../../src/helpers/types";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { ipcMain } from "electron";

registerIpcMainCommand("get-folder", async () => StorageWorker.get("fileTree"));
registerIpcMainCommand("clear-folder", () =>
  StorageWorker.replace("fileTree", {})
);

function addUniqueChildrenToNode(
  tree: TFolderTree,
  parentPath: string,
  newChildren: TFolderTree[]
) {
  const parentNode = findNodeByPath(tree, parentPath);
  if (!parentNode) {
    return;
  }
  if (!parentNode.children) parentNode.children = [];

  const existingPaths = new Set(parentNode.children.map((c: any) => c.path));

  const uniqueNewChildren = newChildren.filter(
    (child) => !existingPaths.has(child.path)
  );

  parentNode.children.push(...uniqueNewChildren);
}

function findNodeByPath(tree: any, targetPath: string): any | null {
  if (tree.path === targetPath || tree.root === targetPath) return tree;
  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }
  return null;
}

ipcMain.handle("get-subfolder-data", async (_event, dirPath) => {
  try {
    if (!dirPath) return;
    if (dirPath === StorageWorker.get("fileTree")?.root) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const children: any = entries.map(
      (entry) =>
        ({
          id: Date.now() + Math.random(),
          name: entry.name,
          path: path.join(dirPath, entry.name),
          type: entry.isDirectory() ? "folder" : "file",
          containingFolderPath: dirPath,
          children: entry.isDirectory() ? [] : null,
        }) as any
    );

    const fileTree = StorageWorker.get("fileTree");
    addUniqueChildrenToNode(fileTree, dirPath, children);
    StorageWorker.store("fileTree", fileTree);

    mainWindow.webContents.send("folder-updated");

    return children;
  } catch (err) {
    throw err;
  }
});

function nodeExistsByPath(tree: any, targetPath: string): boolean {
  if (tree.path === targetPath || tree.root === targetPath) return true;
  if (tree.children && tree.children.length > 0) {
    return tree.children.some((child: any) =>
      nodeExistsByPath(child, targetPath)
    );
  }
  return false;
}

function findParentIdByPath(tree: any, targetPath: string): number | null {
  if (
    (tree.path === targetPath || tree.root === targetPath) &&
    tree.type === "folder"
  ) {
    return tree.id;
  }
  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      const result = findParentIdByPath(child, targetPath);
      if (result !== null) return result;
    }
  }
  return null;
}

function findNodeById(tree: any, id: number): TFolderTree | null {
  if (tree.id === id) return tree;
  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      const result = findNodeById(child, id);
      if (result) return result;
    }
  }
  return null;
}

function createNode(
  fullPath: string,
  parentPath: string,
  type: "folder" | "file"
): TFolderTree {
  return {
    id: Date.now(),
    name: path.basename(fullPath),
    parentPath,
    path: fullPath,
    type,
    children: type === "folder" ? [] : undefined,
  };
}

function collectAllPaths(tree: any): string[] {
  const paths = [tree.path || tree.root];
  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      paths.push(...collectAllPaths(child));
    }
  }
  return paths;
}

function removeNodeByPath(tree: any, targetPath: string): boolean {
  if (!tree.children || tree.children.length === 0) return false;
  const index = tree.children.findIndex(
    (child: any) => child.path === targetPath
  );
  if (index !== -1) {
    tree.children.splice(index, 1);
    return true;
  }
  for (const child of tree.children) {
    if (removeNodeByPath(child, targetPath)) return true;
  }
  return false;
}

function findAndUpdatePath(
  tree: any,
  oldPath: string,
  newPath: string
): boolean {
  if (tree.path === oldPath) {
    tree.path = newPath;
    tree.name = path.basename(newPath);
    tree.parentPath = path.dirname(newPath);
    return true;
  }
  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      if (findAndUpdatePath(child, oldPath, newPath)) return true;
    }
  }
  return false;
}

const recentlyRemoved = new Map<string, number>();
const RENAME_DETECTION_WINDOW = 500;

function isPotentialRename(newPath: string): string | null {
  const now = Date.now();
  const parentPath = path.dirname(newPath);
  for (const [oldPath, timestamp] of recentlyRemoved.entries()) {
    if (
      now - timestamp < RENAME_DETECTION_WINDOW &&
      path.dirname(oldPath) === parentPath
    ) {
      recentlyRemoved.delete(oldPath);
      return oldPath;
    }
  }
  return null;
}

export function RegisterFileTreeWorker() {
  let watcher: FSWatcher | null = null;

  function startWatchingFolder(fileTree: IFolderStructure) {
    const rootFolder = fileTree?.root;
    if (!fileTree || !rootFolder) {
      return;
    }

    const existingPaths = collectAllPaths(fileTree);

    if (watcher) {
      watcher.close().then(() => {});
    }

    watcher = chokidar.watch(rootFolder, {
      ignored: (watchedPath) => {
        return (
          /AppData[\\/](Local|Roaming)[\\/]/i.test(watchedPath) ||
          /INetCache|WindowsApps/i.test(watchedPath)
        );
      },

      persistent: true,
      ignoreInitial: true,
      ignorePermissionErrors: true,
      depth: Infinity,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    watcher.on("add", (filePath: any) => {
      const fileTree = StorageWorker.get("fileTree");
      const parentPath = path.dirname(filePath);
      const renamedFrom = isPotentialRename(filePath);
      if (renamedFrom && findAndUpdatePath(fileTree, renamedFrom, filePath)) {
        StorageWorker.store("fileTree", fileTree);
        mainWindow.webContents.send("folder-updated");
        return;
      }

      if (nodeExistsByPath(fileTree, filePath)) return;
      const parentId = findParentIdByPath(fileTree, parentPath);
      if (parentId === null) return;
      const parentNode = findNodeById(fileTree, parentId);
      if (!parentNode) return;

      const newNode = createNode(filePath, parentPath, "file");
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);
      StorageWorker.store("fileTree", fileTree);
      mainWindow.webContents.send("folder-updated");
    });

    watcher.on("addDir", (dirPath: any) => {
      const fileTree = StorageWorker.get("fileTree");
      const parentPath = path.dirname(dirPath);
      const renamedFrom = isPotentialRename(dirPath);
      if (renamedFrom && findAndUpdatePath(fileTree, renamedFrom, dirPath)) {
        StorageWorker.store("fileTree", fileTree);
        mainWindow.webContents.send("folder-updated");
        return;
      }

      if (nodeExistsByPath(fileTree, dirPath)) return;
      const parentId = findParentIdByPath(fileTree, parentPath);
      if (parentId === null) return;
      const parentNode = findNodeById(fileTree, parentId);
      if (!parentNode) return;

      const newNode = createNode(dirPath, parentPath, "folder");
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);
      StorageWorker.store("fileTree", fileTree);
      mainWindow.webContents.send("folder-updated");
    });

    watcher.on("unlink", (filePath: any) => {
      recentlyRemoved.set(filePath, Date.now());
      const fileTree = StorageWorker.get("fileTree");
      if (removeNodeByPath(fileTree, filePath)) {
        StorageWorker.store("fileTree", fileTree);
        mainWindow.webContents.send("folder-updated");
      }
    });

    watcher.on("unlinkDir", (dirPath: any) => {
      recentlyRemoved.set(dirPath, Date.now());
      const fileTree = StorageWorker.get("fileTree");
      if (removeNodeByPath(fileTree, dirPath)) {
        StorageWorker.store("fileTree", fileTree);
        mainWindow.webContents.send("folder-updated");
      }
    });
  }

  const initialFileTree = StorageWorker.get("fileTree");
  startWatchingFolder(initialFileTree);

  ipcMain.on("chokidar-change-folder", (event, data) => {
    const updatedTree = StorageWorker.get("fileTree");

    startWatchingFolder(updatedTree);
  });
}
