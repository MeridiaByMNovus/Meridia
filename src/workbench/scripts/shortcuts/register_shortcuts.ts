import {
  TActiveFile,
  TPanelState,
  TProjectOptions,
} from "../../react-hooks/types";
import { handle_run_file } from "../../services/use_functions";
import { handle_set_settings } from "../../services/use_tabs_function";

interface RegisterShortcutsProps {
  dispatch: Function;
  layout: TPanelState;
  togglePanel: Function;
  useMainContextIn: any;
  active_file: TActiveFile;
  project_options: TProjectOptions;
}

export function RegisterShortcuts({
  dispatch,
  layout,
  togglePanel,
  useMainContextIn,
  active_file,
  project_options,
}: RegisterShortcutsProps) {
  window.electron.ipcRenderer.on("toggle-left-panel", () => {
    togglePanel(dispatch, layout, "left");
  });
  window.electron.ipcRenderer.on("toggle-right-panel", () => {
    togglePanel(dispatch, layout, "right");
  });
  window.electron.ipcRenderer.on("toggle-bottom-panel", () => {
    togglePanel(dispatch, layout, "bottom");
  });
  window.electron.ipcRenderer.on("open-settings", () => {
    handle_set_settings(useMainContextIn);
  });
  window.electron.ipcRenderer.on("save-current-file", () => {
    useMainContextIn.handle_save_current_file();
  });
  window.electron.ipcRenderer.on("run-current-file", () => {
    handle_run_file(
      active_file,
      togglePanel,
      dispatch,
      layout,
      project_options
    );
  });
}
