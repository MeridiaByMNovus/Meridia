import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import { mainWindow } from "../../../main";

let fileWatcher: FSWatcher | null = null;

export function startFileWatcher(rootPath: string) {
  stopFileWatcher();

  fileWatcher = chokidar.watch(rootPath, {
    ignored: [/node_modules/, /\.git/, /\.DS_Store/, /Thumbs\.db/],
    ignoreInitial: true,
    persistent: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  fileWatcher.on("add", async (filePath) => {
    const parentDir = path.dirname(filePath);
    const fileName = path.basename(filePath);

    mainWindow.webContents.send("files-node-added", {
      parentUri: parentDir,
      nodeName: fileName,
      nodeType: "file",
    });
  });

  fileWatcher.on("addDir", async (dirPath) => {
    const parentDir = path.dirname(dirPath);
    const dirName = path.basename(dirPath);

    mainWindow.webContents.send("files-node-added", {
      parentUri: parentDir,
      nodeName: dirName,
      nodeType: "folder",
    });
  });

  fileWatcher.on("unlink", async (filePath) => {
    mainWindow.webContents.send("files-node-removed", {
      nodeUri: filePath,
    });
  });

  fileWatcher.on("unlinkDir", async (dirPath) => {
    mainWindow.webContents.send("files-node-removed", {
      nodeUri: dirPath,
    });
  });

  fileWatcher.on("change", async (filePath) => {
    mainWindow.webContents.send("files-node-changed", {
      nodeUri: filePath,
    });
  });
}

export function stopFileWatcher() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
}
