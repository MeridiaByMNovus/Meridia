/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dialog } from "electron";
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

const window = mainWindow;

const executeCommand = new CommandRegistry().execute;

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
  executeCommand("new-file-tab", "");
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
    mainWindow.reload();
  }
}

export function handleCloseProject() {
  StorageService.set("fileTree", null);
}

export function handleSaveCurrentFile() {
  executeCommand("save-current-file", "");
}

export function handleOpenSettings() {
  executeCommand("open-settings", "");
}

export function handleOpenSidebar() {
  executeCommand("toggle-left-panel", "");
}

export function handleOpenRightPanel() {
  executeCommand("toggle-right-panel", "");
}

export function handleOpenBottomPanel() {
  executeCommand("toggle-bottom-panel", "");
}

export function handleOpenTerminal() {
  executeCommand("open-terminal", "");
}

export function handleRun() {
  executeCommand("run-current-file", "");
}

export function handleOpenCommandPalette() {
  executeCommand("open-command-palette", "");
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
    mainWindow.reload();
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
  mainWindow.reload();
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
  mainWindow.reload();
};
