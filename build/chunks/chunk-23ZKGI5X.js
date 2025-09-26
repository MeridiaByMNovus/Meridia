import {
  init_workbench_event_panel,
  setPanelVisibilty
} from "./chunk-V4MSIQFO.js";
import {
  changePanelOptionsWidth,
  init_workbench_event_panel_options
} from "./chunk-TFNBFXUN.js";
import {
  init_workbench_store_selector,
  watch
} from "./chunk-EEHJVTSK.js";
import {
  init_workbench_event_editor,
  mount
} from "./chunk-ZXHOGWCE.js";
import {
  __commonJS
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.init.ts
var require_workbench_init = __commonJS({
  "src/code/workbench/common/workbench.init.ts"() {
    init_workbench_event_editor();
    init_workbench_event_panel();
    init_workbench_event_panel_options();
    init_workbench_store_selector();
    watch(
      (s) => s.main.panel_state,
      (next) => {
        const _leftEl = document.querySelector(".left-panel");
        const _rightEl = document.querySelector(".right-panel");
        const _bottomEl = document.querySelector(".bottom-panel");
        setPanelVisibilty(_leftEl, next.left);
        setPanelVisibilty(_rightEl, next.right);
        setPanelVisibilty(_bottomEl, next.bottom);
      }
    );
    setTimeout(() => {
      mount();
      changePanelOptionsWidth();
    }, 100);
  }
});

export {
  require_workbench_init
};
