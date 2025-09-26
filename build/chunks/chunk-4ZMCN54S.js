import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.panel.options.option.ts
var PanelOption;
var init_workbench_part_panel_options_option = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.panel.options.option.ts"() {
    init_workbench_part_el();
    PanelOption = class extends CoreEl {
      constructor(_name, _onClickCallback, _icon) {
        super();
        this._name = _name;
        this._onClickCallback = _onClickCallback;
        this._icon = _icon;
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("span");
        if (this._icon) this._el.innerHTML = this._icon;
        else this._el.innerHTML = this._name;
        if (this._onClickCallback) this._onClickCallback();
      }
    };
  }
});

export {
  PanelOption,
  init_workbench_part_panel_options_option
};
