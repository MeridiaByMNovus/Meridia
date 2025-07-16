import { ipcMain } from "electron";
import { run_code } from "./functions_worker";
import { GetVariable } from "../scripts/get_variable";
import { PythonShell } from "python-shell";
import { execFile } from "child_process";
import { python_version_script } from "../scripts/get_python_versions";

async function extractVariables(path: string) {
  const variables = await GetVariable({ path: path });

  return variables;
}

export function RegisterPythonWorker() {
  ipcMain.on("file-run", async (event, filePath, id) => {
    try {
      mainWindow.webContents.send("save-current-file");

      run_code({ path: filePath, id: id });

      const variables = await extractVariables(filePath);

      event.reply("variables-result", variables);
    } catch (error) {
      event.reply("variables-error", error.message);
    }
  });

  ipcMain.handle("get-python-versions", async () => {
    try {
      const results = await PythonShell.runString(python_version_script, {
        mode: "text",
        pythonOptions: ["-u"],
      });

      const parsed = JSON.parse(results.join("") || "[]");
      return parsed;
    } catch (error) {
      throw new Error("Failed to get Python versions: " + error.message);
    }
  });

  ipcMain.handle("check-conda-exe", async (_, exePath: string) => {
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
  });
}
