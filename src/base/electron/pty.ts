import * as pty from "node-pty";
import { terminals } from "../../meridia/platform/scripts/terminal_manager";
import {
  StorageWorker,
  DATA_JSON_PATH,
  handleDataChange,
} from "../../meridia/platform/workers/";

export const Pty = ({ ipcMain }: any) => {
  function getCurrentCwd() {
    return (
      StorageWorker.get("fileTree")?.root ||
      process.env.HOME ||
      process.env.USERPROFILE
    );
  }

  ipcMain.on("terminal.spawn", (event: any, id: number) => {
    const shell = process.platform === "win32" ? "powershell.exe" : "bash";
    const cwd = getCurrentCwd();

    const term = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd,
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

  const folder_structure = StorageWorker.get("fileTree");
  const folder_tree = JSON.parse(
    require("fs").readFileSync(DATA_JSON_PATH, "utf8")
  )["fileTree"];

  handleDataChange(
    DATA_JSON_PATH,
    folder_tree,
    folder_structure,
    "fileTree",
    () => {}
  );
};
