import chokidar from "chokidar";
import fs from "fs";
import { DATA_JSON_PATH, StorageWorker } from "./";

export function RegisterDataChangeWorker() {
  const folder_structure = StorageWorker.get("fileTree");
  const folder_tree = JSON.parse(fs.readFileSync(DATA_JSON_PATH).toString())[
    "fileTree"
  ];

  function handle_window_change(folder_tree: any) {
    if (folder_tree !== null && folder_tree !== folder_structure) {
      mainWindow.show();
      welcomeWizardWindow.hide();
    } else {
      mainWindow.hide();
      welcomeWizardWindow.show();
    }
  }

  const data_file_chokidar = chokidar.watch(DATA_JSON_PATH ?? "", {
    persistent: true,
    ignoreInitial: true,
  });

  data_file_chokidar.on("change", (path) => {
    const content = JSON.parse(fs.readFileSync(path).toString());
    const folder_tree = content["fileTree"];

    handle_window_change(folder_tree);
  });

  handle_window_change(folder_tree);
}
