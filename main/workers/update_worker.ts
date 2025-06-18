import { autoUpdater, dialog } from "electron";

export function RegisterUpdateWorker() {
  // autoUpdater.setFeedURL({
  //   url: "https://updates.meridiaapp.dev/releases/",
  // });
  // autoUpdater.checkForUpdates();
  // autoUpdater.on("update-available", () => {
  //   dialog.showMessageBox({
  //     type: "info",
  //     title: "Update Available",
  //     message:
  //       "A new version of Meridia is available. It will be downloaded and installed automatically.",
  //   });
  // });
  // autoUpdater.on("update-downloaded", () => {
  //   dialog
  //     .showMessageBox({
  //       type: "question",
  //       title: "Update Ready",
  //       message:
  //         "The update has been downloaded. Do you want to restart Meridia now to apply the update?",
  //       buttons: ["Restart Now", "Later"],
  //       defaultId: 0,
  //       cancelId: 1,
  //     })
  //     .then((result) => {
  //       if (result.response === 0) {
  //         autoUpdater.quitAndInstall();
  //       }
  //     });
  // });
  // autoUpdater.on("error", (error) => {
  //   console.error("AutoUpdater error:", error);
  // });
}
