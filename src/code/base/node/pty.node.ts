import { ipcMain } from "electron";
import * as os from "os";
import * as pty from "node-pty";
import { mainWindow } from "../../../main";

const terminals = new Map<string, pty.IPty>();

function getShell(): string {
  if (os.platform() === "win32") {
    return process.env.COMSPEC || "cmd.exe";
  }
  return process.env.SHELL || "/bin/bash";
}

setTimeout(() => {
  ipcMain.handle(
    "pty-spawn",
    (event, id: string, cols: number, rows: number) => {
      if (terminals.has(id)) {
        terminals.get(id)!.kill();
        terminals.delete(id);
      }

      const shell = getShell();

      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols,
        rows,
        cwd: os.homedir(),
        env: process.env,
      });

      ptyProcess.onData((data) => {
        mainWindow.webContents.send(`pty-data-${id}`, data);
      });

      terminals.set(id, ptyProcess);
      return true;
    }
  );

  ipcMain.handle(
    "pty-resize",
    (event, id: string, cols: number, rows: number) => {
      const term = terminals.get(id);
      // if (term) {
      //   term.resize(cols, rows);
      //   return true;
      // }
      // return false;
      return true;
    }
  );

  ipcMain.handle("pty-write", (event, id: string, data: string) => {
    const term = terminals.get(id);
    if (term) {
      term.write(data);
      return true;
    }
    return false;
  });

  ipcMain.handle("pty-kill", (event, id: string) => {
    const term = terminals.get(id);
    if (term) {
      term.kill();
      terminals.delete(id);
      return true;
    }
    return false;
  });
}, 100);
