/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dialog } from "electron";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { get_files } from "../scripts/get_files";
import { registerCommand } from "./command_worker";
import { IFolderStructure } from "../../../workbench/react-hooks/types";
import { StorageWorker } from "./storage_worker";
import { terminals } from "../scripts/terminal_manager";
import { PythonShell } from "python-shell";

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
