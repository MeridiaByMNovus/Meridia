import fs from "fs";
import path from "path";
import { DATA_JSON_PATH, handleDataChange, StorageWorker } from ".";

export async function RegisterProjectOptionsWorker() {
  const cwd = StorageWorker.get("fileTree")?.root || "";
  const data_file_path = path.join(cwd, "./.meridia", "data.json");

  if (!fs.existsSync(data_file_path)) return;

  const folder_structure = StorageWorker.get("fileTree");
  const folder_tree = JSON.parse(fs.readFileSync(DATA_JSON_PATH).toString())[
    "fileTree"
  ];

  function handle_send_data() {
    const cwd = StorageWorker.get("fileTree")?.root || "";
    const data_file_path = path.join(cwd, "./.meridia", "data.json");

    const data_file_content = JSON.parse(
      fs.readFileSync(data_file_path, "utf8")
    );
    const python_path = data_file_content[0]?.project_python_path;
    const python_version_tag = data_file_content[0]?.project_python_version_tag;
    const python_version = data_file_content[0]?.project_python_version;

    mainWindow.webContents.send("update-project-options", {
      data: {
        python_path,
        python_version,
        python_version_tag,
      },
    });
  }

  mainWindow.webContents.on("did-finish-load", () => {
    handleDataChange(
      DATA_JSON_PATH,
      folder_tree,
      folder_structure,
      "fileTree",
      handle_send_data
    );
  });
}
