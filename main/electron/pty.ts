import * as pty from "node-pty";
import { terminals } from "../scripts/terminal_manager";

export const Pty = ({ ipcMain, cwd }: any) => {
  ipcMain.on("terminal.spawn", (event: any, id: number) => {
    const shell = process.platform === "win32" ? "powershell.exe" : "bash";
    const term = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: cwd || process.env.HOME || process.env.USERPROFILE,
      env: process.env,
    });

    term.onData((data) => {
      event.sender.send(`terminal.incomingData.${id}`, data);
    });

    terminals.set(id, term);
  });

  ipcMain.on("terminal.keystroke", (_event: any, { id, data }: any) => {
    const term = terminals.get(id);
    if (term) {
      try {
        term.write(data);
      } catch (e) {
        console.warn(`Terminal write failed for id=${id}`, e);
      }
    }
  });

  ipcMain.on("terminal.kill", (_event: any, id: number) => {
    const term = terminals.get(id);
    if (term) {
      try {
        term.kill();
        terminals.delete(id);
      } catch {}
    }
  });

  ipcMain.on("terminal.resize", (_event: any, { id, cols, rows }: any) => {
    const term = terminals.get(id);
    if (term && Number.isInteger(cols) && Number.isInteger(rows)) {
      term.resize(cols, rows);
    }
  });
};
