import { ipcRenderer } from "electron";

ipcRenderer.on("command-update-folder-structure", (event, data) => {
  event.sender.send("folder-updated", data.updatedData);
});
