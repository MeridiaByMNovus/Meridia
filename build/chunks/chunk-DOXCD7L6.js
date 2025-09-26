import {
  init_workbench_store_selector,
  watch
} from "./chunk-EEHJVTSK.js";
import {
  dispatch,
  init_workbench_store
} from "./chunk-FPULJOSR.js";
import {
  init_workbench_store_slice,
  update_editor_tabs,
  update_panel_state
} from "./chunk-EWJVXHY4.js";
import {
  __commonJS
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.uistate.ts
var require_workbench_uistate = __commonJS({
  "src/code/workbench/common/workbench.uistate.ts"() {
    init_workbench_store_selector();
    init_workbench_store();
    init_workbench_store_slice();
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
  }
});

export {
  require_workbench_uistate
};
