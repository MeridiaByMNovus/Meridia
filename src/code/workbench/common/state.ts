import { watch } from "./store/selector.js";
import { dispatch } from "./store/store.js";
import { update_editor_tabs, update_panel_state } from "./store/slice.js";

function _init() {
  const editor_tabs = window.storage.get("workbench.editor.files.tabs");
  const panel_state = window.storage.get("workbench.workspace.panel.state");
  if (editor_tabs) {
    dispatch(update_editor_tabs(editor_tabs));
  }
  if (panel_state) {
    dispatch(update_panel_state(panel_state));
  }
}

watch(
  (s) => s.main.editor_tabs,
  (next) => window.storage.store("workbench.editor.files.tabs", next)
);

watch(
  (s) => s.main.panel_state,
  (next) => window.storage.store("workbench.workspace.panel.state", next)
);

_init();
