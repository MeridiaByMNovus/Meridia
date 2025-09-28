import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import { mainWindow } from "../../../main";

let fileWatcher: FSWatcher | null = null;
let watchRootPath: string = "";

export function _watch(rootPath: string) {
  _stop();

  watchRootPath = path.normalize(rootPath);

  fileWatcher = chokidar.watch(rootPath, {
    ignored: [
      /node_modules/,
      /\.git/,
      /\.DS_Store/,
      /Thumbs\.db/,
      /\/\.wine/,
      /\/proc/,
      (filePath) =>
        filePath.includes("/proc") || filePath.includes(".wine/dosdevices"),
    ],
    ignoreInitial: true,
    persistent: true,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  fileWatcher.on("add", async (filePath) => {
    const normalizedPath = path.normalize(filePath);
    const parentDir = path.dirname(normalizedPath);
    const fileName = path.basename(normalizedPath);

    const relativeParentPath = path.relative(watchRootPath, parentDir);
    const parentUri =
      relativeParentPath === ""
        ? watchRootPath
        : path.join(watchRootPath, relativeParentPath);

    mainWindow.webContents.send("files-node-added", {
      parentUri: parentUri.replace(/\\/g, "/"),
      nodeName: fileName,
      nodeType: "file",
    });
  });

  fileWatcher.on("addDir", async (dirPath) => {
    const normalizedPath = path.normalize(dirPath);
    const parentDir = path.dirname(normalizedPath);
    const dirName = path.basename(normalizedPath);

    const relativeParentPath = path.relative(watchRootPath, parentDir);
    const parentUri =
      relativeParentPath === ""
        ? watchRootPath
        : path.join(watchRootPath, relativeParentPath);

    mainWindow.webContents.send("files-node-added", {
      parentUri: parentUri.replace(/\\/g, "/"),
      nodeName: dirName,
      nodeType: "folder",
    });
  });

  fileWatcher.on("unlink", async (filePath) => {
    const normalizedPath = path.normalize(filePath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-removed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
  });

  fileWatcher.on("unlinkDir", async (dirPath) => {
    const normalizedPath = path.normalize(dirPath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-removed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
  });

  fileWatcher.on("change", async (filePath) => {
    const normalizedPath = path.normalize(filePath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-changed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
  });
}

export function _stop() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
  watchRootPath = "";
}
