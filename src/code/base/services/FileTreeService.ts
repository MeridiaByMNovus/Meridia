import fs from "fs";
import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { ipcMain } from "electron";
import { StorageService } from "./StorageService.js";
import type { IFolderStructure, TFolderTree } from "../../../typings/types.js";
import { mainWindow } from "../../../main.js";
import { log } from "../common/functions.js";

const fsp = fs.promises;

export class FileTreeService {
  private fileTree = StorageService.get("fileTree") as IFolderStructure;
  private watcher: FSWatcher | null = null;
  private recentlyRemoved = new Map<string, number>();
  private readonly RENAME_WINDOW = 500;
  private window = mainWindow;

  constructor() {
    log("info", "FileTreeService initializing...");

    try {
      log("debug", "Initial configuration", {
        hasFileTree: !!this.fileTree,
        fileTreeRoot: this.fileTree?.root,
        hasWindow: !!this.window,
        renameWindow: this.RENAME_WINDOW,
      });

      this.setupIPC();

      // Update folder on initialization
      this.updateFolderOnInit();

      log("info", "FileTreeService initialized successfully");
    } catch (error) {
      log("error", "Failed to initialize FileTreeService", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private updateFolderOnInit() {
    try {
      log("info", "Updating folder on initialization...");

      if (this.fileTree?.root && fs.existsSync(this.fileTree.root)) {
        // Refresh the current working directory
        this.changeCwd(this.fileTree.root);
        log("debug", "File watcher reinitialized for root directory");
      }

      // Send folder update notification
      if (this.window && this.window.webContents) {
        // Small delay to ensure renderer is ready
        setTimeout(() => {
          this.window.webContents.send("folder-updated");
          log("debug", "Initial folder update notification sent");
        }, 100);
      } else {
        log("warn", "Main window not available for initial folder update");
      }
    } catch (error) {
      log("error", "Failed to update folder on init", {
        error: error.message,
      });
    }
  }

  public changeCwd(cwd: string) {
    log("info", "Changing current working directory", {
      newCwd: cwd,
      previousWatcher: !!this.watcher,
    });

    try {
      // Close existing watcher
      if (this.watcher) {
        log("debug", "Closing existing file watcher");
        this.watcher.close();
        this.watcher = null;
      }

      // Validate new directory
      if (!fs.existsSync(cwd)) {
        throw new Error(`Directory does not exist: ${cwd}`);
      }

      const stats = fs.statSync(cwd);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${cwd}`);
      }

      log("debug", "Creating new file watcher", { cwd });
      this.watcher = chokidar.watch(cwd, {
        persistent: true,
        ignorePermissionErrors: true,
        depth: Infinity,
      });

      this.watch(this.fileTree);
      log("info", "CWD changed successfully", { cwd });
    } catch (error) {
      log("error", "Failed to change CWD", {
        cwd,
        error: error.message,
      });
      throw error;
    }
  }

  private setupIPC() {
    log("info", "Setting up IPC handlers...");

    // Initialize file watching
    try {
      this.watch(this.fileTree);
      log("debug", "Initial file watching started");
    } catch (error) {
      log("warn", "Failed to start initial file watching", {
        error: error.message,
      });
    }

    // Get folder handler
    ipcMain.handle("get-folder", async () => {
      log("debug", "IPC: get-folder called");
      const fileTree = StorageService.get("fileTree");
      log("debug", "Retrieved file tree", {
        hasRoot: !!fileTree?.root,
        root: fileTree?.root,
      });
      return fileTree;
    });

    // Get subfolder data handler
    ipcMain.handle("get-subfolder-data", async (_event, dirPath) => {
      const startTime = Date.now();
      log("debug", "IPC: get-subfolder-data called", { dirPath });

      try {
        if (!dirPath) {
          log("warn", "No directory path provided");
          return;
        }

        if (!fs.existsSync(dirPath)) {
          throw new Error(`Directory does not exist: ${dirPath}`);
        }

        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        log("debug", "Read directory entries", {
          dirPath,
          entryCount: entries.length,
          entries: entries.map((e) => ({
            name: e.name,
            isDir: e.isDirectory(),
          })),
        });

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

        log("debug", "Created child nodes", {
          childCount: children.length,
          folders: children.filter((c) => c.type === "folder").length,
          files: children.filter((c) => c.type === "file").length,
        });

        const fileTree = StorageService.get("fileTree");
        this.addUniqueChildrenToNode(fileTree, dirPath, children);
        StorageService.set("fileTree", fileTree);

        const duration = Date.now() - startTime;
        log("info", "Subfolder data retrieved successfully", {
          dirPath,
          childCount: children.length,
          duration: `${duration}ms`,
        });

        return children;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Failed to get subfolder data", {
          dirPath,
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    });

    // Read file content handler
    ipcMain.handle("fs-get-file-content", async (_e, filePath: string) => {
      const startTime = Date.now();
      log("debug", "IPC: fs-get-file-content called", { filePath });

      try {
        if (!fs.existsSync(filePath)) {
          throw new Error(`File does not exist: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          throw new Error(`Path is not a file: ${filePath}`);
        }

        const content = await fsp.readFile(filePath, "utf-8");
        const duration = Date.now() - startTime;

        log("info", "File content read successfully", {
          filePath,
          contentLength: content.length,
          fileSize: stats.size,
          duration: `${duration}ms`,
        });

        return content;
      } catch (error) {
        const duration = Date.now() - startTime;
        log("error", "Failed to read file content", {
          filePath,
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }
    });

    // Rename handler
    ipcMain.handle(
      "fs-rename",
      async (
        _e,
        { oldPath, newName }: { oldPath: string; newName: string }
      ) => {
        const startTime = Date.now();
        log("debug", "IPC: fs-rename called", { oldPath, newName });

        try {
          const newPath = path.join(path.dirname(oldPath), newName);

          if (!fs.existsSync(oldPath)) {
            throw new Error(`Source path does not exist: ${oldPath}`);
          }

          if (fs.existsSync(newPath)) {
            throw new Error(`Destination already exists: ${newPath}`);
          }

          await fsp.rename(oldPath, newPath);
          log("debug", "File system rename completed", { oldPath, newPath });

          const tree = StorageService.get("fileTree");
          const pathUpdated = this.updatePath(tree, oldPath, newPath);

          if (pathUpdated) {
            StorageService.set("fileTree", tree);
            this.window.webContents.send("folder-updated");
            log("debug", "Tree updated and notification sent");
          } else {
            log("warn", "Path not found in tree for update", {
              oldPath,
              newPath,
            });
          }

          const duration = Date.now() - startTime;
          log("info", "Rename operation completed", {
            oldPath,
            newPath,
            duration: `${duration}ms`,
          });

          return { path: newPath };
        } catch (error) {
          const duration = Date.now() - startTime;
          log("error", "Rename operation failed", {
            oldPath,
            newName,
            error: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }
      }
    );

    // Create file handler
    ipcMain.handle(
      "fs-create-file",
      async (
        _e,
        { parentPath, name }: { parentPath: string; name: string }
      ) => {
        const startTime = Date.now();
        log("debug", "IPC: fs-create-file called", { parentPath, name });

        try {
          const filePath = path.join(parentPath, name);

          if (!fs.existsSync(parentPath)) {
            throw new Error(`Parent directory does not exist: ${parentPath}`);
          }

          if (fs.existsSync(filePath)) {
            throw new Error(`File already exists: ${filePath}`);
          }

          await fsp.writeFile(filePath, "");
          log("debug", "File created on filesystem", { filePath });

          const tree = StorageService.get("fileTree");
          const parentNode = this.findNodeByPath(tree, parentPath);

          if (parentNode) {
            const node = this.createNode(filePath, parentPath, "file");
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
            StorageService.set("fileTree", tree);
            this.window.webContents.send("folder-updated");

            const duration = Date.now() - startTime;
            log("info", "File created successfully", {
              filePath,
              parentPath,
              nodeId: node.id,
              duration: `${duration}ms`,
            });

            return node;
          } else {
            log("error", "Parent node not found in tree", { parentPath });
            return null;
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          log("error", "File creation failed", {
            parentPath,
            name,
            error: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }
      }
    );

    // Create folder handler
    ipcMain.handle(
      "fs-create-folder",
      async (
        _e,
        { parentPath, name }: { parentPath: string; name: string }
      ) => {
        const startTime = Date.now();
        log("debug", "IPC: fs-create-folder called", { parentPath, name });

        try {
          const folderPath = path.join(parentPath, name);

          if (!fs.existsSync(parentPath)) {
            throw new Error(`Parent directory does not exist: ${parentPath}`);
          }

          if (fs.existsSync(folderPath)) {
            throw new Error(`Folder already exists: ${folderPath}`);
          }

          await fsp.mkdir(folderPath);
          log("debug", "Folder created on filesystem", { folderPath });

          const tree = StorageService.get("fileTree");
          const parentNode = this.findNodeByPath(tree, parentPath);

          if (parentNode) {
            const node = this.createNode(folderPath, parentPath, "folder");
            node.children = [];
            parentNode.children = parentNode.children || [];
            parentNode.children.push(node);
            StorageService.set("fileTree", tree);
            this.window.webContents.send("folder-updated");

            const duration = Date.now() - startTime;
            log("info", "Folder created successfully", {
              folderPath,
              parentPath,
              nodeId: node.id,
              duration: `${duration}ms`,
            });

            return node;
          } else {
            log("error", "Parent node not found in tree", { parentPath });
            return null;
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          log("error", "Folder creation failed", {
            parentPath,
            name,
            error: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }
      }
    );

    // Delete handler
    ipcMain.handle(
      "fs-delete",
      async (_e, { path: targetPath }: { path: string }) => {
        const startTime = Date.now();
        log("debug", "IPC: fs-delete called", { targetPath });

        try {
          if (!fs.existsSync(targetPath)) {
            log("warn", "Target path does not exist", { targetPath });
          } else {
            const stats = fs.statSync(targetPath);
            log("debug", "Deleting from filesystem", {
              targetPath,
              isDirectory: stats.isDirectory(),
              size: stats.size,
            });

            await fsp.rm(targetPath, { recursive: true, force: true });
            log("debug", "Filesystem deletion completed", { targetPath });
          }

          const tree = StorageService.get("fileTree");
          const nodeRemoved = this.removeNode(tree, targetPath);

          if (nodeRemoved) {
            StorageService.set("fileTree", tree);
            this.window.webContents.send("folder-updated");
            log("debug", "Node removed from tree and notification sent");
          } else {
            log("warn", "Node not found in tree for removal", { targetPath });
          }

          const duration = Date.now() - startTime;
          log("info", "Delete operation completed", {
            targetPath,
            nodeRemoved,
            duration: `${duration}ms`,
          });

          return { success: true };
        } catch (error) {
          const duration = Date.now() - startTime;
          log("error", "Delete operation failed", {
            targetPath,
            error: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }
      }
    );

    // Move handler
    ipcMain.handle(
      "fs-move",
      async (_e, { src, destDir }: { src: string; destDir: string }) => {
        const startTime = Date.now();
        log("debug", "IPC: fs-move called", { src, destDir });

        try {
          const destPath = path.join(destDir, path.basename(src));

          if (!fs.existsSync(src)) {
            throw new Error(`Source path does not exist: ${src}`);
          }

          if (!fs.existsSync(destDir)) {
            throw new Error(`Destination directory does not exist: ${destDir}`);
          }

          if (fs.existsSync(destPath)) {
            throw new Error(`Destination already exists: ${destPath}`);
          }

          await fsp.rename(src, destPath);
          log("debug", "Filesystem move completed", { src, destPath });

          const tree = StorageService.get("fileTree");

          // Remove from old parent
          let movedNode: TFolderTree | null = null;
          const extractNode = (node: any): boolean => {
            if (!node.children) return false;
            const i = node.children.findIndex((c: any) => c.path === src);
            if (i !== -1) {
              movedNode = node.children.splice(i, 1)[0];
              log("debug", "Node extracted from old parent", {
                nodeId: movedNode.id,
                nodeName: movedNode.name,
              });
              return true;
            }
            return node.children.some(extractNode);
          };
          extractNode(tree);

          // Attach to new parent
          const destParent = this.findNodeByPath(tree, destDir);
          if (movedNode && destParent) {
            movedNode.path = destPath;
            movedNode.name = path.basename(destPath);
            movedNode.parentPath = destDir;
            destParent.children = destParent.children || [];
            destParent.children.push(movedNode);

            log("debug", "Node attached to new parent", {
              nodeId: movedNode.id,
              newPath: destPath,
              newParent: destDir,
            });
          } else {
            log("error", "Failed to complete tree move operation", {
              movedNodeExists: !!movedNode,
              destParentExists: !!destParent,
            });
          }

          StorageService.set("fileTree", tree);
          this.window.webContents.send("folder-updated");

          const duration = Date.now() - startTime;
          log("info", "Move operation completed", {
            src,
            destPath,
            destDir,
            duration: `${duration}ms`,
          });

          return { path: destPath, parentPath: destDir };
        } catch (error) {
          const duration = Date.now() - startTime;
          log("error", "Move operation failed", {
            src,
            destDir,
            error: error.message,
            duration: `${duration}ms`,
          });
          throw error;
        }
      }
    );

    log("info", "IPC handlers setup completed", {
      handlers: [
        "get-folder",
        "get-subfolder-data",
        "fs-get-file-content",
        "fs-rename",
        "fs-create-file",
        "fs-create-folder",
        "fs-delete",
        "fs-move",
      ],
    });
  }

  private watch(fileTree: IFolderStructure) {
    log("info", "Setting up file system watching...");

    const root = fileTree?.root;
    if (!root) {
      log("warn", "No root directory found for watching");
      return;
    }

    log("debug", "Configuring file watcher", { root });

    try {
      if (this.watcher) {
        log("debug", "Closing existing watcher");
        this.watcher.close();
      }

      const existingPaths = this.collectAllPaths(fileTree);
      log("debug", "Collected existing paths", {
        pathCount: existingPaths.length,
        samplePaths: existingPaths.slice(0, 5),
      });

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

      this.watcher.on("ready", () => {
        log("info", "File watcher ready", { root });
      });

      this.watcher.on("error", (error) => {
        log("error", "File watcher error", {
          error: error,
          root,
        });
      });

      log("info", "File system watching configured successfully", { root });
    } catch (error) {
      log("error", "Failed to setup file watching", {
        root,
        error: error.message,
      });
    }
  }

  private handleAdd(type: "file" | "folder") {
    return (filePath: string) => {
      log("debug", `File ${type} added`, { filePath, type });

      try {
        const fileTree = StorageService.get("fileTree");
        const parentPath = path.dirname(filePath);
        const renamedFrom = this.detectRename(filePath);

        const stats = fs.statSync(filePath);
        const isFolder = stats.isDirectory();

        log("debug", "Processing file addition", {
          filePath,
          parentPath,
          renamedFrom,
          isFolder,
          fileSize: stats.size,
        });

        // Handle rename detection
        if (renamedFrom && this.updatePath(fileTree, renamedFrom, filePath)) {
          StorageService.set("fileTree", fileTree);
          this.window.webContents.send("folder-updated", {
            path: filePath,
            isFolder,
          });
          log("info", "File rename detected and processed", {
            oldPath: renamedFrom,
            newPath: filePath,
          });
          return;
        }

        // Check if node already exists
        if (this.nodeExists(fileTree, filePath)) {
          log("debug", "Node already exists, skipping", { filePath });
          return;
        }

        // Find parent and add new node
        const parentId = this.findParentId(fileTree, parentPath);
        const parentNode = parentId
          ? this.findNodeById(fileTree, parentId)
          : null;

        if (!parentNode) {
          log("warn", "Parent node not found for new file", {
            filePath,
            parentPath,
            parentId,
          });
          return;
        }

        const newNode = this.createNode(filePath, parentPath, type);
        parentNode.children = parentNode.children || [];
        parentNode.children.push(newNode);
        StorageService.set("fileTree", fileTree);

        this.window.webContents.send("folder-updated", {
          path: filePath,
          isFolder,
        });

        log("info", `${type} added successfully`, {
          filePath,
          nodeId: newNode.id,
          parentPath,
        });
      } catch (error) {
        log("error", `Failed to handle ${type} addition`, {
          filePath,
          type,
          error: error.message,
        });
      }
    };
  }

  private handleUnlink() {
    return (targetPath: string) => {
      log("debug", "File/folder unlinked", { targetPath });

      try {
        this.recentlyRemoved.set(targetPath, Date.now());
        log("debug", "Added to recently removed list", {
          targetPath,
          recentlyRemovedCount: this.recentlyRemoved.size,
        });

        const fileTree = StorageService.get("fileTree");
        const nodeRemoved = this.removeNode(fileTree, targetPath);

        if (nodeRemoved) {
          StorageService.set("fileTree", fileTree);
          this.window.webContents.send("folder-updated");
          log("info", "Node removed from tree", { targetPath });
        } else {
          log("warn", "Node not found for removal", { targetPath });
        }
      } catch (error) {
        log("error", "Failed to handle unlink", {
          targetPath,
          error: error.message,
        });
      }
    };
  }

  private detectRename(newPath: string): string | null {
    const now = Date.now();
    const parentPath = path.dirname(newPath);

    log("debug", "Detecting rename operation", {
      newPath,
      parentPath,
      recentlyRemovedCount: this.recentlyRemoved.size,
      renameWindow: this.RENAME_WINDOW,
    });

    for (const [oldPath, timestamp] of this.recentlyRemoved.entries()) {
      const timeDiff = now - timestamp;
      if (
        timeDiff < this.RENAME_WINDOW &&
        path.dirname(oldPath) === parentPath
      ) {
        this.recentlyRemoved.delete(oldPath);
        log("info", "Rename detected", {
          oldPath,
          newPath,
          timeDiff: `${timeDiff}ms`,
        });
        return oldPath;
      }
    }

    // Clean up old entries
    const cleaned = [];
    for (const [oldPath, timestamp] of this.recentlyRemoved.entries()) {
      if (now - timestamp >= this.RENAME_WINDOW) {
        this.recentlyRemoved.delete(oldPath);
        cleaned.push(oldPath);
      }
    }

    if (cleaned.length > 0) {
      log("debug", "Cleaned up old rename candidates", { cleaned });
    }

    return null;
  }

  private updatePath(tree: any, oldPath: string, newPath: string): boolean {
    log("debug", "Updating path in tree", { oldPath, newPath });

    if (tree.path === oldPath) {
      tree.path = newPath;
      tree.name = path.basename(newPath);
      tree.parentPath = path.dirname(newPath);
      log("debug", "Path updated successfully", { oldPath, newPath });
      return true;
    }

    const updated =
      tree.children?.some((child: any) =>
        this.updatePath(child, oldPath, newPath)
      ) ?? false;

    return updated;
  }

  private removeNode(tree: any, targetPath: string): boolean {
    if (!tree.children || tree.children.length === 0) return false;

    const index = tree.children.findIndex(
      (child: any) => child.path === targetPath
    );
    if (index !== -1) {
      const removed = tree.children.splice(index, 1)[0];
      log("debug", "Node removed from tree", {
        targetPath,
        removedNodeId: removed.id,
        removedNodeName: removed.name,
      });
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
    const node = {
      id: Date.now() + Math.random(),
      name: path.basename(fullPath),
      parentPath,
      path: fullPath,
      type,
      children: type === "folder" ? [] : undefined,
    };

    log("debug", "Created new node", {
      nodeId: node.id,
      name: node.name,
      type,
      path: fullPath,
    });

    return node;
  }

  private collectAllPaths(tree: any): string[] {
    const paths = [tree.path || tree.root];
    for (const child of tree.children ?? []) {
      paths.push(...this.collectAllPaths(child));
    }
    return paths;
  }

  private addUniqueChildrenToNode(
    tree: IFolderStructure,
    parentPath: string,
    newChildren: TFolderTree[]
  ) {
    log("debug", "Adding unique children to node", {
      parentPath,
      newChildrenCount: newChildren.length,
    });

    const parentNode = this.findNodeByPath(tree, parentPath);
    if (!parentNode) {
      log("warn", "Parent node not found for adding children", { parentPath });
      return;
    }

    parentNode.children = parentNode.children || [];
    const existingPaths = new Set(parentNode.children.map((c) => c.path));
    const uniqueChildren = newChildren.filter(
      (c) => !existingPaths.has(c.path)
    );

    parentNode.children.push(...uniqueChildren);

    log("debug", "Unique children added", {
      parentPath,
      addedCount: uniqueChildren.length,
      skippedCount: newChildren.length - uniqueChildren.length,
      totalChildren: parentNode.children.length,
    });
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
