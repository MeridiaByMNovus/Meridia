import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.panel.options.ts
var PanelOptions;
var init_workbench_part_panel_options = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.panel.options.ts"() {
    init_workbench_part_el();
    PanelOptions = class extends CoreEl {
      constructor(_options, _parentEl, _className) {
        super();
        this._options = _options;
        this._parentEl = _parentEl;
        this._className = _className;
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "panel-options";
        if (this._className) {
          this._el.classList.add(this._className);
        }
        this._options.forEach((_option) => {
          this._el?.appendChild(_option);
        });
      }
      _updateContent(_contentEl) {
        this._parentEl.appendChild(_contentEl);
      }
    };
  }
});

export {
  PanelOptions,
  init_workbench_part_panel_options
};
