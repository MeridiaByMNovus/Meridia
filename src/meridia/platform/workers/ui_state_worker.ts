import { StorageWorker } from "./storage_worker";

// registerIpcMainCommand("get-ui-state", async () =>
//   StorageWorker.get("uiState")
// );

// registerIpcMainCommand("set-ui-state", async (event: any, data: any) =>
//   StorageWorker.store("uiState", data)
// );

export function RegisterUiStateWorker() {
  const uiState = StorageWorker.get("uiState");

  if (uiState === undefined) {
    StorageWorker.store("uiState", {});
  }
}
