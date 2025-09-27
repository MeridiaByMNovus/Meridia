import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import { mainWindow } from "../../../main";

let fileWatcher: FSWatcher | null = null;
let watchRootPath: string = "";

export function _watch(rootPath: string) {
  _stop();

  watchRootPath = path.normalize(rootPath);

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
    console.log(`File added: ${filePath} -> Parent: ${parentUri}`);
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
    console.log(`Directory added: ${dirPath} -> Parent: ${parentUri}`);
  });

  fileWatcher.on("unlink", async (filePath) => {
    const normalizedPath = path.normalize(filePath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-removed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
    console.log(`File removed: ${filePath} -> URI: ${nodeUri}`);
  });

  fileWatcher.on("unlinkDir", async (dirPath) => {
    const normalizedPath = path.normalize(dirPath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-removed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
    console.log(`Directory removed: ${dirPath} -> URI: ${nodeUri}`);
  });

  fileWatcher.on("change", async (filePath) => {
    const normalizedPath = path.normalize(filePath);

    const relativePath = path.relative(watchRootPath, normalizedPath);
    const nodeUri = path.join(watchRootPath, relativePath);

    mainWindow.webContents.send("files-node-changed", {
      nodeUri: nodeUri.replace(/\\/g, "/"),
    });
    console.log(`File changed: ${filePath} -> URI: ${nodeUri}`);
  });
}

export function _stop() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
  watchRootPath = "";
}
