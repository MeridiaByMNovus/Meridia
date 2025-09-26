import {
  init_workbench_editor
} from "./chunk-AD7RKSEW.js";
import {
  init_workbench_theme
} from "./chunk-Z57IUYIR.js";
import {
  require_workbench_uistate
} from "./chunk-DOXCD7L6.js";
import {
  init_workbench_event_statusbar
} from "./chunk-4XLQ7E2F.js";
import {
  require_workbench_resources
} from "./chunk-EFTJKXQG.js";
import {
  require_workbench_scrollbar
} from "./chunk-IDZ2SKYZ.js";
import {
  init_workbench_web
} from "./chunk-6KB7KKTZ.js";
import {
  init_workbench_event_panel_options
} from "./chunk-TFNBFXUN.js";
import {
  init_workbench_event_editor
} from "./chunk-ZXHOGWCE.js";
import {
  __commonJS,
  __toESM
} from "./chunk-KH45J4DC.js";

// src/code/workbench/workbench.main.ts
var require_workbench_main = __commonJS({
  "src/code/workbench/workbench.main.ts"() {
    init_workbench_web();
    init_workbench_theme();
    init_workbench_editor();
    var import_workbench_scrollbar = __toESM(require_workbench_scrollbar());
    var import_workbench_uistate = __toESM(require_workbench_uistate());
    init_workbench_event_statusbar();
    init_workbench_event_panel_options();
    init_workbench_event_editor();
    var import_workbench_resources = __toESM(require_workbench_resources());
  }
});

export {
  require_workbench_main
};
