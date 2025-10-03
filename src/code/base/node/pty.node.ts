import { ipcMain } from "electron";
import { mainWindow } from "../../../main";
import * as os from "os";
import * as pty from "node-pty";

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
    (event, id: string, cols: number, rows: number, cwd: string) => {
      if (terminals.has(id)) {
        terminals.get(id)!.kill();
        terminals.delete(id);
      }

      const shell = getShell();

      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols,
        rows,
        cwd: cwd !== "" ? cwd : os.homedir(),
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
      if (term) {
        term.resize(cols, rows);
        return true;
      } else {
        return false;
      }
    }
  );

  ipcMain.handle("pty-write", (event, id: string, data: string) => {
    return new Promise<boolean>((resolve) => {
      const term = terminals.get(id);
      if (!term) {
        resolve(false);
        return;
      }

      const onData = (output: string) => {
        if (
          output.includes("$") ||
          output.includes(">") ||
          output.includes("#")
        ) {
          resolve(true);
        }
      };

      const disposable = term.onData(onData);

      term.write(data);

      setTimeout(() => {
        disposable.dispose();
        resolve(true);
      }, 5000);
    });
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

  ipcMain.handle(
    "pty-run-command",
    (event, id: string, command: string, cwd: string) => {
      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const term = terminals.get(id);
        if (!term) {
          resolve({ success: false, error: "Terminal not found" });
          return;
        }

        try {
          setTimeout(() => {
            term.write(command + "\r");
          }, 200);

          resolve({ success: true });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    }
  );
}, 100);
