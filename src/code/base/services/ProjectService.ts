import fs from "fs";
import path from "path";
import { ipcMain } from "electron";
import { exec } from "child_process";
import {
  get_set_folder_structure,
  handleDataChange,
} from "../common/functions.js";
import { StorageService } from "./StorageService.js";
import { FileInitService } from "./FileInitService.js";
import { mainWindow } from "../../../main.js";

export class ProjectService {
  private window = mainWindow;
  private STORE_JSON_PATH = new FileInitService().STORE_JSON_PATH;

  private registerIpcListeners() {
    ipcMain.on("create-project", (_, data: any) => {
      if (!data) return;

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

      if (!fs.existsSync(location)) fs.mkdirSync(location, { recursive: true });

      if (welcome_script)
        fs.writeFileSync(path.join(location, "main.py"), welcome_script_data);

      if (git) {
        try {
          exec("git init", { cwd: location });
        } catch {}
      }

      const metaDir = path.join(location, ".meridia");
      fs.mkdirSync(metaDir, { recursive: true });

      fs.writeFileSync(
        path.join(metaDir, "data.json"),
        JSON.stringify(project_info_data, null, 2)
      );

      get_set_folder_structure({ path: location });
    });
  }

  private watchProjectOptions() {
    this.window.webContents.on("did-finish-load", () => {
      const cwd = StorageService.get("fileTree")?.root;
      if (!cwd) return;

      const data_file_path = path.join(cwd, ".meridia", "data.json");
      if (!fs.existsSync(data_file_path)) return;

      const folder_structure = StorageService.get("fileTree");
      const folder_tree = JSON.parse(
        fs.readFileSync(this.STORE_JSON_PATH, "utf8")
      )["fileTree"];

      handleDataChange(
        this.STORE_JSON_PATH,
        folder_tree,
        folder_structure,
        "fileTree",
        () => this.sendProjectOptions()
      );
    });
  }

  private sendProjectOptions() {
    const cwd = StorageService.get("fileTree")?.root;
    if (!cwd) return;

    const data_file_path = path.join(cwd, ".meridia", "data.json");
    if (!fs.existsSync(data_file_path)) return;

    const content = JSON.parse(fs.readFileSync(data_file_path, "utf8"));
    const {
      project_python_path,
      project_python_version_tag,
      project_python_version,
    } = content[0] || {};

    this.window.webContents.send("update-project-options", {
      data: {
        python_path: project_python_path,
        python_version: project_python_version,
        python_version_tag: project_python_version_tag,
      },
    });
  }
}
