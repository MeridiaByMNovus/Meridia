import fs from "fs";
import path from "path";
import { ipcMain } from "electron";
import { TProjectData } from "../../../workbench/react-hooks/types";
import { exec } from "child_process";
import { get_set_folder_structure } from "./functions_worker";

export function RegisterProjectWorker() {
  ipcMain.on("create-project", (_, data: TProjectData) => {
    const location = data.path;
    const git = data.git;
    const welcome_script = data.welcome_script;
    const is_python = data.is_python;
    const python_path = data.python_path;
    const python_version = data.python_version;
    const python_version_tag = data.python_version_tag;
    const conda_path = data.conda_path;

    const welcome_script_data = `print("hello from Meridia")`;

    const project_info_data = [
      {
        project_path: location,
        project_is_python: is_python,
        project_python_path: python_path,
        project_python_version: python_version,
        project_python_version_tag: python_version_tag,
        project_conda_path: conda_path,
      },
    ];

    console.log(project_info_data);

    if (data) {
      if (!fs.existsSync(location)) fs.mkdirSync(location);

      if (welcome_script)
        fs.writeFileSync(location + "/main.py", welcome_script_data);

      if (git)
        try {
          exec("git init", { cwd: location });
        } catch {}

      fs.mkdirSync(path.join(location, ".meridia"), { recursive: true });

      fs.writeFileSync(
        path.join(location, ".meridia", "data.json"),
        JSON.stringify(project_info_data)
      );

      get_set_folder_structure({ path: location });
    }
  });
}
