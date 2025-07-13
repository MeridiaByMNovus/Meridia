import { TActiveFile, TLayout } from "../../helpers/types";
import { handle_run_file } from "../../hooks/use_functions";
import { handle_set_settings } from "../../hooks/use_tabs_function";

interface RegisterShortcutsProps {
  dispatch: Function;
  layout: TLayout;
  togglePanel: Function;
  useMainContextIn: any;
  active_file: TActiveFile;
}

export function RegisterShortcuts({
  dispatch,
  layout,
  togglePanel,
  useMainContextIn,
  active_file,
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
    console.log("running file");
    handle_run_file(active_file, togglePanel, dispatch, layout);
  });
}
