import fs from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { ipcMain } from "electron";
import { StorageService } from "./StorageService.js";
import type { IFolderStructure, TFolderTree } from "../../../typings/types.js";
import { mainWindow } from "../../../main.js";

const fsp = fs.promises;

export class FileTreeService {
  private fileTree = StorageService.get("fileTree") as IFolderStructure;
  private watcher: FSWatcher | null = null;
  private recentlyRemoved = new Map<string, number>();
  private readonly RENAME_WINDOW = 500;
  private window = mainWindow;

  constructor() {
    this.setupIPC();
  }

  public changeCwd(cwd: string) {
    this.watcher?.close();
    this.watcher = chokidar.watch(cwd, {
      persistent: true,
      ignorePermissionErrors: true,
      depth: Infinity,
    });
    this.watch(this.fileTree);
  }

  private setupIPC() {
    this.watch(this.fileTree);

    ipcMain.handle("get-folder", async () => StorageService.get("fileTree"));

    ipcMain.handle("get-subfolder-data", async (_event, dirPath) => {
      if (!dirPath) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const children = entries.map((entry) => ({
        id: Date.now() + Math.random(),
        name: entry.name,
        path: path.join(dirPath, entry.name),
        type: entry.isDirectory() ? "folder" : "file",
        parentPath: dirPath,
        children: entry.isDirectory() ? [] : undefined,
      })) as TFolderTree[];

      const stats = fs.statSync(dirPath);
      const isFolder = stats.isDirectory();

      const fileTree = StorageService.get("fileTree");
      this.addUniqueChildrenToNode(fileTree, dirPath, children);
      StorageService.set("fileTree", fileTree);

      return children;
    });

    ipcMain.handle("fs-get-file-content", async (_e, filePath: string) => {
      return fsp.readFile(filePath, "utf-8");
    });

    ipcMain.handle(
      "fs-rename",
      async (
        _e,
        { oldPath, newName }: { oldPath: string; newName: string }
      ) => {
        const newPath = path.join(path.dirname(oldPath), newName);
        await fsp.rename(oldPath, newPath);

        const tree = StorageService.get("fileTree");
        this.updatePath(tree, oldPath, newPath);
        StorageService.set("fileTree", tree);
        this.window.webContents.send("folder-updated");

        return { path: newPath };
      }
    );

    ipcMain.handle(
      "fs-create-file",
      async (
        _e,
        { parentPath, name }: { parentPath: string; name: string }
      ) => {
        const filePath = path.join(parentPath, name);
        await fsp.writeFile(filePath, "");

        const tree = StorageService.get("fileTree");
        const parentNode = this.findNodeByPath(tree, parentPath);
        if (parentNode) {
          const node = this.createNode(filePath, parentPath, "file");
          parentNode.children = parentNode.children || [];
          parentNode.children.push(node);
          StorageService.set("fileTree", tree);
          this.window.webContents.send("folder-updated");
          return node;
        }
        return null;
      }
    );

    ipcMain.handle(
      "fs-create-folder",
      async (
        _e,
        { parentPath, name }: { parentPath: string; name: string }
      ) => {
        const folderPath = path.join(parentPath, name);
        await fsp.mkdir(folderPath);

        const tree = StorageService.get("fileTree");
        const parentNode = this.findNodeByPath(tree, parentPath);
        if (parentNode) {
          const node = this.createNode(folderPath, parentPath, "folder");
          node.children = [];
          parentNode.children = parentNode.children || [];
          parentNode.children.push(node);
          StorageService.set("fileTree", tree);
          this.window.webContents.send("folder-updated");
          return node;
        }
        return null;
      }
    );

    ipcMain.handle(
      "fs-delete",
      async (_e, { path: targetPath }: { path: string }) => {
        await fsp.rm(targetPath, { recursive: true, force: true });

        const tree = StorageService.get("fileTree");
        if (this.removeNode(tree, targetPath)) {
          StorageService.set("fileTree", tree);
          this.window.webContents.send("folder-updated");
        }
        return { success: true };
      }
    );

    ipcMain.handle(
      "fs-move",
      async (_e, { src, destDir }: { src: string; destDir: string }) => {
        const destPath = path.join(destDir, path.basename(src));
        await fsp.rename(src, destPath);

        const tree = StorageService.get("fileTree");

        // remove from old parent
        let movedNode: TFolderTree | null = null;
        const extractNode = (node: any): boolean => {
          if (!node.children) return false;
          const i = node.children.findIndex((c: any) => c.path === src);
          if (i !== -1) {
            movedNode = node.children.splice(i, 1)[0];
            return true;
          }
          return node.children.some(extractNode);
        };
        extractNode(tree);

        // attach to new parent
        const destParent = this.findNodeByPath(tree, destDir);
        if (movedNode && destParent) {
          movedNode.path = destPath;
          movedNode.name = path.basename(destPath);
          movedNode.parentPath = destDir;
          destParent.children = destParent.children || [];
          destParent.children.push(movedNode);
        }

        StorageService.set("fileTree", tree);
        this.window.webContents.send("folder-updated");
        return { path: destPath, parentPath: destDir };
      }
    );
  }

  private watch(fileTree: IFolderStructure) {
    const root = fileTree?.root;
    if (!root) return;

    if (this.watcher) this.watcher.close();
    const existingPaths = this.collectAllPaths(fileTree);

    this.watcher = chokidar.watch(root, {
      persistent: true,
      ignoreInitial: true,
      ignorePermissionErrors: true,
      depth: Infinity,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 },
      ignored: (watchedPath) =>
        /AppData[\\/](Local|Roaming)[\\/]/i.test(watchedPath) ||
        /INetCache|WindowsApps/i.test(watchedPath),
    });

    this.watcher.on("add", this.handleAdd("file"));
    this.watcher.on("addDir", this.handleAdd("folder"));
    this.watcher.on("unlink", this.handleUnlink());
    this.watcher.on("unlinkDir", this.handleUnlink());
  }

  private handleAdd(type: "file" | "folder") {
    return (filePath: string) => {
      const fileTree = StorageService.get("fileTree");
      const parentPath = path.dirname(filePath);
      const renamedFrom = this.detectRename(filePath);

      const stats = fs.statSync(filePath);
      const isFolder = stats.isDirectory();

      if (renamedFrom && this.updatePath(fileTree, renamedFrom, filePath)) {
        StorageService.set("fileTree", fileTree);
        this.window.webContents.send("folder-updated", {
          path: filePath,
          isFolder,
        });
        return;
      }

      if (this.nodeExists(fileTree, filePath)) return;

      const parentId = this.findParentId(fileTree, parentPath);
      const parentNode = parentId
        ? this.findNodeById(fileTree, parentId)
        : null;
      if (!parentNode) return;

      const newNode = this.createNode(filePath, parentPath, type);
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);
      StorageService.set("fileTree", fileTree);
      this.window.webContents.send("folder-updated", {
        path: filePath,
        isFolder,
      });
    };
  }

  private handleUnlink() {
    return (targetPath: string) => {
      this.recentlyRemoved.set(targetPath, Date.now());
      const fileTree = StorageService.get("fileTree");
      if (this.removeNode(fileTree, targetPath)) {
        StorageService.set("fileTree", fileTree);
        this.window.webContents.send("folder-updated");
      }
    };
  }

  private detectRename(newPath: string): string | null {
    const now = Date.now();
    const parentPath = path.dirname(newPath);
    for (const [oldPath, timestamp] of this.recentlyRemoved.entries()) {
      if (
        now - timestamp < this.RENAME_WINDOW &&
        path.dirname(oldPath) === parentPath
      ) {
        this.recentlyRemoved.delete(oldPath);
        return oldPath;
      }
    }

    return null;
  }

  private updatePath(tree: any, oldPath: string, newPath: string): boolean {
    if (tree.path === oldPath) {
      tree.path = newPath;
      tree.name = path.basename(newPath);
      tree.parentPath = path.dirname(newPath);
      return true;
    }
    return (
      tree.children?.some((child: any) =>
        this.updatePath(child, oldPath, newPath)
      ) ?? false
    );
  }

  private removeNode(tree: any, targetPath: string): boolean {
    if (!tree.children || tree.children.length === 0) return false;
    const index = tree.children.findIndex(
      (child: any) => child.path === targetPath
    );
    if (index !== -1) {
      tree.children.splice(index, 1);
      return true;
    }
    return tree.children.some((child: any) =>
      this.removeNode(child, targetPath)
    );
  }

  private nodeExists(tree: any, targetPath: string): boolean {
    if (tree.path === targetPath || tree.root === targetPath) return true;
    return (
      tree.children?.some((child: any) => this.nodeExists(child, targetPath)) ??
      false
    );
  }

  private findParentId(tree: any, targetPath: string): number | null {
    if (
      (tree.path === targetPath || tree.root === targetPath) &&
      tree.type === "folder"
    ) {
      return tree.id;
    }
    for (const child of tree.children ?? []) {
      const result = this.findParentId(child, targetPath);
      if (result !== null) return result;
    }
    return null;
  }

  private findNodeById(tree: any, id: number): TFolderTree | null {
    if (tree.id === id) return tree;
    for (const child of tree.children ?? []) {
      const result = this.findNodeById(child, id);
      if (result) return result;
    }
    return null;
  }

  private createNode(
    fullPath: string,
    parentPath: string,
    type: "folder" | "file"
  ): TFolderTree {
    return {
      id: Date.now() + Math.random(),
      name: path.basename(fullPath),
      parentPath,
      path: fullPath,
      type,
      children: type === "folder" ? [] : undefined,
    };
  }

  private collectAllPaths(tree: any): string[] {
    const paths = [tree.path || tree.root];
    for (const child of tree.children ?? []) {
      paths.push(...this.collectAllPaths(child));
    }
    return paths;
  }

  private addUniqueChildrenToNode(
    tree: TFolderTree,
    parentPath: string,
    newChildren: TFolderTree[]
  ) {
    const parentNode = this.findNodeByPath(tree, parentPath);
    if (!parentNode) return;

    parentNode.children = parentNode.children || [];
    const existingPaths = new Set(parentNode.children.map((c) => c.path));
    const uniqueChildren = newChildren.filter(
      (c) => !existingPaths.has(c.path)
    );
    parentNode.children.push(...uniqueChildren);
  }

  private findNodeByPath(tree: any, targetPath: string): TFolderTree | null {
    if (tree.path === targetPath || tree.root === targetPath) return tree;
    for (const child of tree.children ?? []) {
      const found = this.findNodeByPath(child, targetPath);
      if (found) return found;
    }
    return null;
  }
}
