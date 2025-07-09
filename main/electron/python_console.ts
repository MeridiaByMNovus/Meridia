import os from "os";
import * as pty from "node-pty";

const terminals = new Map<number, pty.IPty>();

export const PythonConsole = ({ ipcMain }: any) => {
  const shell = os.platform() === "win32" ? "python.exe" : "python3";

  ipcMain.on("python-console.spawn", (event: any, id: number) => {
    const term = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env,
    });

    term.onData((data) => {
      event.sender.send(`python-console.incomingData.${id}`, data);
    });

    terminals.set(id, term);
  });

  ipcMain.on("python-console.keystroke", (_event: any, { id, data }: any) => {
    const term = terminals.get(id);
    if (term) {
      try {
        term.write(data);
      } catch (e) {
        console.warn(`Write failed for Python console id=${id}`, e);
      }
    }
  });

  ipcMain.on("python-console.kill", (_event: any, id: number) => {
    const term = terminals.get(id);
    if (term) {
      try {
        term.kill();
      } catch {}
      terminals.delete(id);
    }
  });

  ipcMain.on(
    "python-console.resize",
    (_event: any, { id, cols, rows }: any) => {
      const term = terminals.get(id);
      if (term && Number.isInteger(cols) && Number.isInteger(rows)) {
        term.resize(cols, rows);
      }
    }
  );
};
