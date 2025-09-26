import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.el.ts
var CoreEl;
var init_workbench_part_el = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.el.ts"() {
    CoreEl = class {
      _el = null;
      getDomElement() {
        if (!this._el) return;
        return this._el;
      }
      destroy() {
        if (!this._el) return;
        this._el.remove();
      }
    };
  }
});

export {
  CoreEl,
  init_workbench_part_el
};
