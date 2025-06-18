import { ipcMain } from "electron";
import { run_code } from "./functions_worker";
import { GetVariable } from "../scripts/getVariable";

async function extractVariables(path: string) {
  const variables = await GetVariable({ path: path });

  return variables;
}

export function RegisterPythonWorker() {
  ipcMain.on("file-run", async (event, filePath) => {
    try {
      run_code({ data: { path: filePath } });

      const variables = await extractVariables(filePath);

      event.reply("variables-result", variables);
    } catch (error) {
      event.reply("variables-error", error.message);
    }
  });
}
