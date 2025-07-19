import fs from "fs";
import { registerIpcMainCommand } from "./command_worker";
import { open_set_folder } from "../../../main";
import {
  create_file,
  create_folder,
  delete_file,
  delete_folder,
  handle_rename,
} from "../scripts/file_actions";
import {
  refresh_window,
  set_folder_structure,
  get_file_content,
} from "./functions_worker";
import { IFolderStructure } from "../../../workbench/react-hooks/types";

export function RegisterIpcCommandsWorker() {
  registerIpcMainCommand("create-folder", (_event, data) =>
    fs.mkdirSync(data.path)
  );

  registerIpcMainCommand("open-set-folder", () => open_set_folder());

  registerIpcMainCommand("refresh-window", (_event, folder) =>
    refresh_window({ folder: folder })
  );

  registerIpcMainCommand("create-folder", (_event, data) =>
    create_folder({ data })
  );

  registerIpcMainCommand("delete-folder", (_event, data) =>
    delete_folder({ data })
  );

  registerIpcMainCommand("create-file", (_event, data) =>
    create_file({ data })
  );

  registerIpcMainCommand("delete-file", (_event, data) =>
    delete_file({ data })
  );

  registerIpcMainCommand("rename", (event, data) => handle_rename(event, data));

  registerIpcMainCommand("get-file-content", async (_event, path) =>
    get_file_content({ path })
  );

  registerIpcMainCommand("save-file", (_event, data) =>
    fs.writeFileSync(data.path, data.content)
  );

  registerIpcMainCommand("send-tools-data", (_event, data) => {
    mainWindow.webContents.send("update-tools-data", data);
  });

  registerIpcMainCommand(
    "set-folder-structure",
    (_event, structure: IFolderStructure) =>
      set_folder_structure({ structure: structure })
  );
}
