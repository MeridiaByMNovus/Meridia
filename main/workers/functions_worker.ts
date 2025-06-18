/* eslint-disable @typescript-eslint/ban-ts-comment */
import { dialog } from "electron";
import path from "path";
import {
  createMeridiaWindow,
  main_window_preload_webpack_entry,
  mainWindow,
  new_project_webpack_entry,
  newProjectWindow,
} from "..";
import fs from "fs";
import { PythonShell } from "python-shell";
import { spawn } from "child_process";
import { get_files } from "../electron/get_files";
import { registerCommand } from "./command_worker";
import { IFolderStructure } from "../../src/helpers/types";
import { StorageWorker } from "./storage_worker";

export const get_file_content = ({ path }: { path: string }) => {
  try {
    const file_content = fs.readFileSync(path, "utf8");

    return file_content;
  } catch (err) {
    return err;
  }
};

export const run_code = ({ data }: { data: { path: string } }) => {
  try {
    const { path } = data;
    if (!path.endsWith(".py") && !path.endsWith(".js")) return;

    const isPython = path.endsWith(".py");
    let process: any;

    const startTime = Date.now();

    if (isPython) {
      process = new PythonShell(path, {
        pythonPath: PythonShell.defaultPythonPath,
        mode: "text",
        pythonOptions: ["-u"], // unbuffered output for real-time streaming
      });
    } else {
      process = spawn("node", [path]);
    }

    const command = isPython
      ? `${PythonShell.defaultPythonPath} ${path}`
      : `node ${path}`;

    // Send the command line first
    mainWindow?.webContents.send("received-output", {
      type: "command",
      content: command,
    });

    const handleOutput = (output: any) => {
      const message = output.toString().trim();
      if (message) {
        mainWindow?.webContents.send("received-output", {
          type: "output",
          content: message,
        });
      }
    };

    if (!isPython && process.stdout) {
      process.stdout.on("data", handleOutput);
    }

    if (isPython) {
      process.on("message", handleOutput);
      process.on("stdout", handleOutput); // Sometimes output is on stdout for PythonShell
    }

    if (process.stderr) {
      process.stderr.on("data", (error: any) => {
        const errorMsg = `Error: ${error.toString().trim()}`;
        mainWindow?.webContents.send("received-output", {
          type: "output",
          content: errorMsg,
        });
      });
    }

    // On process exit, send exit code and elapsed time as "end"
    if (!isPython) {
      process.on("close", (code: number) => {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(3);
        const endMessage = `[Done] exited with code=${code} in ${elapsedSeconds} seconds`;
        mainWindow?.webContents.send("received-output", {
          type: "end",
          content: endMessage,
        });
      });
    } else {
      // PythonShell emits 'close' as well with exit code
      process.on("close", (code: number) => {
        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(3);
        const endMessage = `[Done] exited with code=${code} in ${elapsedSeconds} seconds`;
        mainWindow?.webContents.send("received-output", {
          type: "end",
          content: endMessage,
        });
      });
    }
  } catch (err) {}
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

export function handleSaveCurrentFile() {
  registerCommand("save-current-file", "");
}

export function handleNewProject() {
  if (newProjectWindow && !newProjectWindow.isDestroyed()) {
    newProjectWindow.show();
    return;
  }

  let newProjectWindowModified = createMeridiaWindow({
    width: 1000,
    height: 800,
    preload: main_window_preload_webpack_entry,
    entry: new_project_webpack_entry,
    title: "Meridia – New Project",
  });

  newProjectWindowModified.show();
}

export function handleOpenSettings() {
  registerCommand("open-settings", "");
}

export function handleOpenMeridiaStudio() {
  registerCommand("open-meridia-studio", "");
}

export function handleOpenSidebar() {
  registerCommand("open-sidebar", "");
}

export function handleOpenRightPanel() {
  registerCommand("open-right-panel", "");
}

export function handleOpenBottomPanel() {
  registerCommand("open-bottom-panel", "");
}

export function handleOpenOutput() {
  registerCommand("open-output", "");
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
