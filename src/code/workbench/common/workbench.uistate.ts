import { watch } from "./workbench.store/workbench.store.selector.js";
import { dispatch } from "./workbench.store/workbench.store.js";
import {
  update_editor_tabs,
  update_panel_state,
} from "./workbench.store/workbench.store.slice";

function _init() {
  const editor_tabs = window.storage.get("editor-tabs");
  const panel_state = window.storage.get("panel-state");
  if (editor_tabs) {
    dispatch(update_editor_tabs(editor_tabs));
  }
  if (panel_state) {
    dispatch(update_panel_state(panel_state));
  }
}

watch(
  (s) => s.main.editor_tabs,
  (next) => window.storage.store("editor-tabs", next)
);

watch(
  (s) => s.main.panel_state,
  (next) => window.storage.store("panel-state", next)
);

_init();
