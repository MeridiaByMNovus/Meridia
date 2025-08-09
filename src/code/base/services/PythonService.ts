import { ipcMain, IpcMainEvent } from "electron";
import { PythonShell } from "python-shell";
import { execFile } from "child_process";
import { run_code } from "../common/functions.js";
import { mainWindow } from "../../../main.js";
import path from "path";

const getAvaiablePythonScript = path.resolve(
  __dirname,
  "../python/getAvaiablePython.py"
);

export class PythonService {
  private window = mainWindow;
  constructor() {}
}
