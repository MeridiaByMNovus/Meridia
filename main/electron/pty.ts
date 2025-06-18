import os from "os";
import fs from "fs";
import * as pty from "node-pty";
import { mainWindow } from "..";

let ptyProcess: pty.IPty;
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const homeDir =
  os.platform() === "win32" ? process.env.USERPROFILE : process.env.HOME;

export const Pty = ({ cwd, ipcMain }: { cwd: string; ipcMain: any }) => {
  const spawnTerminal = (dir: string) => {
    if (!fs.existsSync(dir)) {
      mainWindow.webContents.send(
        "terminal.incomingData",
        `\r\nInvalid path: ${dir}\r\n`
      );
      return;
    }

    if (ptyProcess) {
      (ptyProcess as any).removeAllListeners();
      ptyProcess.kill();
    }

    ptyProcess = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: dir,
      env: process.env,
    });

    ptyProcess.onData((data) => {
      mainWindow.webContents.send("terminal.incomingData", data);
    });
  };

  // Initial spawn
  spawnTerminal(cwd || homeDir);

  ipcMain.on("terminal.change-folder", (_event: any, path: string) => {
    spawnTerminal(path || homeDir);
  });

  ipcMain.on("terminal.keystroke", (_event: any, key: string) => {
    if (typeof key === "string" && ptyProcess) {
      ptyProcess.write(key);
    }
  });

  ipcMain.on("terminal.resize", (_event: any, data: any) => {
    if (ptyProcess) {
      ptyProcess.resize(data.cols, data.rows);
    }
  });

  ipcMain.on("terminal.write", (_event: any, line: string) => {
    if (typeof line === "string" && ptyProcess) {
      ptyProcess.write(line);
    }
  });

  process.on("uncaughtException", (err) => {});
};
