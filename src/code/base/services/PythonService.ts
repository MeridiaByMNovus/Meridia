import { ipcMain, IpcMainEvent } from "electron";
import { PythonShell } from "python-shell";
import { execFile } from "child_process";
import { run_code } from "../common/functions.js";
import { getAvaiablePythonScript } from "../python/getAvaiablePython.js";
import { mainWindow } from "../../../main.js";

export class PythonService {
  private window = mainWindow;
  constructor() {
    this.registerIpcHandlers();
  }

  private registerIpcHandlers() {
    ipcMain.on("file-run", this.handleRunFile);
    ipcMain.handle("get-python-versions", this.handleGetPythonVersions);
    ipcMain.handle("check-conda-exe", this.handleCheckCondaExe);
  }

  private async handleRunFile(
    event: IpcMainEvent,
    filePath: string,
    id: number,
    python_path: string
  ) {
    try {
      this.window.webContents.send("save-current-file");

      run_code({ path: filePath, id: id, python: python_path });
    } catch (error: any) {}
  }

  private async handleGetPythonVersions() {
    try {
      const results = await PythonShell.runString(getAvaiablePythonScript, {
        mode: "text",
        pythonOptions: ["-u"],
      });

      const parsed = JSON.parse(results.join("") || "[]");
      return parsed;
    } catch (error: any) {
      throw new Error("Failed to get Python versions: " + error.message);
    }
  }

  private async handleCheckCondaExe(_: any, exePath: string) {
    return new Promise((resolve) => {
      if (!exePath || !exePath.endsWith("conda.exe")) {
        return resolve(false);
      }

      execFile(
        exePath,
        ["--version"],
        { timeout: 3000 },
        (err, stdout, stderr) => {
          if (err || stderr) return resolve(false);
          if (stdout.toLowerCase().includes("conda")) return resolve(true);
          resolve(false);
        }
      );
    });
  }
}
