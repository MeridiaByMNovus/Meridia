/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { getFolder } from "./getFolder.js";
import { IFolderStructure } from "../../../typings/types.js";
import { StorageService } from "../services/StorageService.js";
import { ptyInstances } from "./ptyManager.js";
import { PythonShell } from "python-shell";
import { CommandRegistry } from "../services/CommandRegistryService.js";
import { mainWindow } from "../../../main.js";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const window = mainWindow;

const executeCommand = new CommandRegistry().execute;

ipcMain.handle("create-temp-file", () => {
  const tempDir = tmpdir();
  const filename = `untitled-${randomUUID().slice(0, 8)}.py`;
  const fullPath = path.join(tempDir, filename);
  fs.writeFileSync(fullPath, "", "utf8");
  return { path: fullPath, name: filename };
});

export const get_file_content = ({ path }: { path: string }) => {
  try {
    const file_content = fs.readFileSync(path, "utf8");

    return file_content;
  } catch (err) {
    return err;
  }
};

export const run_code = ({
  path,
  id,
  python,
}: {
  path: string;
  id: number;
  python: string;
}) => {
  if (!path.endsWith(".py") && !path.endsWith(".js")) return;

  const command = `${python ?? PythonShell.defaultPythonPath} ${path}`;

  const term = ptyInstances.get(id);

  if (term) term.write(`${command}\r`);
};

export function handleNewFile() {
  mainWindow.webContents.send("new-file-tab");
}

export async function handleOpenFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ["openFile"],
  });

  if (!canceled && filePaths.length) {
    window.webContents.send("new-file-opened", {
      path: filePaths[0],
      fileName: path.basename(filePaths[0]),
    });
  }
}

export async function handleOpenFolder() {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
  });

  if (!canceled && filePaths.length) {
    const structure = {
      id: 1,
      name: filePaths[0],
      root: filePaths[0],
      type: "folder",
      children: getFolder(filePaths[0]),
    };

    StorageService.set("fileTree", structure);
    mainWindow.webContents.send("window-reset");
  }
}

export function handleCloseProject() {
  StorageService.set("fileTree", null);
}

export function handleSaveCurrentFile() {
  mainWindow.webContents.send("save-current-file");
}

export function handleOpenSettings() {
  mainWindow.webContents.send("open-settings");
}

export function handleOpenSidebar() {
  mainWindow.webContents.send("toggle-left-panel");
}

export function handleOpenRightPanel() {
  mainWindow.webContents.send("toggle-right-panel");
}

export function handleOpenBottomPanel() {
  mainWindow.webContents.send("toggle-bottom-panel");
}

export function handleOpenTerminal() {
  mainWindow.webContents.send("open-terminal");
}

export function handleRun() {
  mainWindow.webContents.send("run-current-file");
}

export function handleOpenCommandPalette() {
  mainWindow.webContents.send("open-command-palette");
}

export async function handleOpenSetFolder() {
  const folder = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
  });
  let structure = undefined;
  if (!folder.canceled) {
    const children = getFolder(folder.filePaths[0]);
    structure = {
      id: 0,
      name: folder.filePaths[0],
      root: folder.filePaths[0],
      type: "folder",
      children,
    };
    StorageService.set("fileTree", structure);
    mainWindow.webContents.send("window-reset");
  }
}

export function handleDataChange(
  file_path: string,
  look_to_change: any,
  compare_to_change: any,
  thing_to_look: string,
  handler: Function
) {
  function handle_window_change(change: any, compare: any) {
    if (change !== null && change !== compare) {
      handler();
    }
  }

  const data_file_chokidar = chokidar.watch(file_path ?? "", {
    persistent: true,
    ignoreInitial: true,
  });

  data_file_chokidar.on("change", () => {
    const content = JSON.parse(fs.readFileSync(file_path).toString());
    const thing = content[thing_to_look];
    handle_window_change(thing, compare_to_change);
  });

  handle_window_change(look_to_change, compare_to_change);
}

export const open_folder = async () => {
  const folder = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
  });
  let structure = undefined;
  if (!folder.canceled) {
    const children = getFolder(folder.filePaths[0]);
    structure = {
      id: 1,
      name: folder.filePaths[0],
      root: folder.filePaths[0],
      type: "folder",
      children,
    };

    StorageService.set("fileTree", structure);
  }

  return structure;
};

export const set_folder_structure = ({
  structure,
}: {
  structure: IFolderStructure;
}) => {
  StorageService.set("fileTree", structure);
};

export const refresh_window = ({ folder }: { folder: string }) => {
  let structure = undefined;

  const children = getFolder(folder);
  structure = {
    id: 0,
    name: folder,
    root: folder,
    type: "folder",
    children,
  };

  StorageService.set("fileTree", structure);
  mainWindow.webContents.send("window-reset");
};

export const get_set_folder_structure = ({ path }: { path: string }) => {
  const structure = {
    id: 1,
    name: path,
    root: path,
    type: "folder",
    children: getFolder(path),
  };

  StorageService.set("fileTree", structure);
  mainWindow.webContents.send("window-reset");
};

ipcMain.handle("read-file", (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});
