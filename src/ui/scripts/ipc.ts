import { set_folder_structure } from "../../helpers/state_manager";
import { IFolderStructure } from "../../helpers/types";

export function registerAllEvents(
  dispatch: any,
  setOpen: (v: boolean) => void
) {
  const ipc = window.electron?.ipcRenderer;
  if (!ipc) return;

  ipc.on("open-command-palette", () => setOpen(true));

  ipc.on("new-folder-opened", async (_: any, path: string) => {
    const folder = (await window.electron.get_folder()) as IFolderStructure;
    if (folder) {
      dispatch(set_folder_structure(folder));
      ipc.send("terminal.change-folder", path);
      ipc.send("chokidar-change-folder", path);
    }
  });

  ipc.on("folder-updated", async () => {
    const folder = (await window.electron.get_folder()) as IFolderStructure;
    if (folder) dispatch(set_folder_structure(folder));
  });
}
