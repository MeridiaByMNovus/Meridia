import {
  TActiveFile,
  TPanelState,
  TProjectOptions,
} from "../react-hooks/types";
import { activeTabId } from "../browser/common/terminal";

export function handle_run_file(
  active_file: TActiveFile,
  setPanel: Function,
  dispatch: Function,
  layout: TPanelState,
  project_options: TProjectOptions
) {
  if (!active_file?.path || activeTabId == null) {
    console.log(activeTabId, active_file);
    window.electron.ipcRenderer.send("show-error-message-box", {
      message: "Please open a file before running.",
      title: "No File Found.",
    });
    return;
  }

  console.log(activeTabId, active_file);

  setPanel(dispatch, layout, "bottom", true);

  window.electron.ipcRenderer.send(
    "file-run",
    active_file.path,
    activeTabId,
    project_options.python_path ?? ""
  );
}
