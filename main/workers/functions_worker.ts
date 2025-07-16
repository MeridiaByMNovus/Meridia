/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dialog } from "electron";
import path from "path";
import fs from "fs";
import { get_files } from "../electron/get_files";
import { registerCommand } from "./command_worker";
import { IFolderStructure } from "../../src/helpers/types";
import { StorageWorker } from "./storage_worker";
import { terminals } from "../scripts/terminal_manager";

export const get_file_content = ({ path }: { path: string }) => {
  try {
    const file_content = fs.readFileSync(path, "utf8");

    return file_content;
  } catch (err) {
    return err;
  }
};

export const run_code = ({ path, id }: { path: string; id: number }) => {
  if (!path.endsWith(".py") && !path.endsWith(".js")) return;

  const isPython = path.endsWith(".py");
  const command = isPython ? `python "${path}"` : `node "${path}"`;

  const term = terminals.get(id);

  if (term) term.write(`${command}\r`);
};

export function handleNewFile() {
  registerCommand("new-file-tab", "");
}

export async function handleOpenFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
  });

  if (!canceled && filePaths.length) {
    mainWindow.webContents.send("new-file-opened", {
      path: filePaths[0],
      fileName: path.basename(filePaths[0]),
    });
  }
}

export async function handleOpenFolder() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (!canceled && filePaths.length) {
    const structure = {
      id: 1,
      name: filePaths[0],
      root: filePaths[0],
      type: "folder",
      children: get_files(filePaths[0]),
    };

    StorageWorker.store("fileTree", structure);
    registerCommand("new-folder-opened", filePaths[0]);
  }
}

export function handleCloseProject() {
  StorageWorker.store("fileTree", null);
}

export function handleSaveCurrentFile() {
  registerCommand("save-current-file", "");
}

export function handleOpenSettings() {
  registerCommand("open-settings", "");
}

export function handleOpenSidebar() {
  registerCommand("toggle-left-panel", "");
}

export function handleOpenRightPanel() {
  registerCommand("toggle-right-panel", "");
}

export function handleOpenBottomPanel() {
  registerCommand("toggle-bottom-panel", "");
}

export function handleOpenTerminal() {
  registerCommand("open-terminal", "");
}

export function handleRun() {
  registerCommand("run-current-file", "");
}

export function handleOpenCommandPalette() {
  registerCommand("open-command-palette", "");
}

export async function handleOpenSetFolder() {
  const folder = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  let structure = undefined;
  if (!folder.canceled) {
    const children = get_files(folder.filePaths[0]);
    structure = {
      id: 0,
      name: folder.filePaths[0],
      root: folder.filePaths[0],
      type: "folder",
      children,
    };
    StorageWorker.store("fileTree", structure);
    mainWindow.webContents.send("new-folder-opened", folder.filePaths[0]);
  }
}

export const open_folder = async () => {
  const folder = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  let structure = undefined;
  if (!folder.canceled) {
    const children = get_files(folder.filePaths[0]);
    structure = {
      id: 1,
      name: folder.filePaths[0],
      root: folder.filePaths[0],
      type: "folder",
      children,
    };

    StorageWorker.store("fileTree", structure);
  }

  return structure;
};

export const set_folder_structure = ({
  structure,
}: {
  structure: IFolderStructure;
}) => {
  StorageWorker.store("fileTree", structure);
};

export const refresh_window = ({ folder }: { folder: string }) => {
  let structure = undefined;

  const children = get_files(folder);
  structure = {
    id: 0,
    name: folder,
    root: folder,
    type: "folder",
    children,
  };

  StorageWorker.store("fileTree", structure);
  mainWindow.webContents.send("new-folder-opened", folder);
};

export const get_set_folder_structure = ({ path }: { path: string }) => {
  const structure = {
    id: 1,
    name: path,
    root: path,
    type: "folder",
    children: get_files(path),
  };

  StorageWorker.store("fileTree", structure);
  registerCommand("new-folder-opened", path);
};
