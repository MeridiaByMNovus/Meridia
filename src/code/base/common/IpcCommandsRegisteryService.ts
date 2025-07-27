import fs from "fs";
import { CommandRegistry } from "../services/CommandRegistryService.js";
import {
  create_file,
  create_folder,
  delete_file,
  delete_folder,
  handle_rename,
} from "./fileActions.js";
import {
  refresh_window,
  set_folder_structure,
  get_file_content,
  handleOpenSetFolder,
} from "./functions.js";
import { IFolderStructure } from "../../../typings/types.js";
import { mainWindow } from "../../../main.js";

export function IpcCommandsRegisteryService() {
  const registry = new CommandRegistry();
  registry.register("create-folder", (_event, data) => fs.mkdirSync(data.path));

  registry.register("open-set-folder", () => handleOpenSetFolder());

  registry.register("refresh-window", (_event, folder) =>
    refresh_window({ folder: folder })
  );

  registry.register("create-folder", (_event, data) => create_folder({ data }));

  registry.register("delete-folder", (_event, data) => delete_folder({ data }));

  registry.register("create-file", (_event, data) => create_file({ data }));

  registry.register("delete-file", (_event, data) => delete_file({ data }));

  registry.register("rename", (event, data) => handle_rename(event, data));

  registry.register("get-file-content", async (_event, path) =>
    get_file_content({ path })
  );

  registry.register("save-file", (_event, data) =>
    fs.writeFileSync(data.path, data.content)
  );

  registry.register("send-tools-data", (_event, data) => {
    mainWindow.webContents.send("update-tools-data", data);
  });

  registry.register(
    "set-folder-structure",
    (_event, structure: IFolderStructure) =>
      set_folder_structure({ structure: structure })
  );
}
