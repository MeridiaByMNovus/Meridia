import {
  Layout,
  init_workbench_layout
} from "./chunk-K3SDGQ5D.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.web.ts
var Web;
var init_workbench_web = __esm({
  "src/code/workbench/browser/workbench.web.ts"() {
    init_workbench_layout();
    Web = class {
      _layout;
      constructor() {
        this._layout = new Layout();
      }
    };
    new Web();
  }
});

export {
  Web,
  init_workbench_web
};
