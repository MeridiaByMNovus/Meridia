import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.panel.ts
var Panel;
var init_workbench_part_panel = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.panel.ts"() {
    init_workbench_part_el();
    Panel = class extends CoreEl {
      constructor(_className) {
        super();
        this._className = _className;
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "panel";
        this._el.classList.add(this._className);
      }
    };
  }
});

export {
  Panel,
  init_workbench_part_panel
};
