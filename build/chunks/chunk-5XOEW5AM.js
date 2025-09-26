import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.standalone.ts
function registerStandalone(name, standalone) {
  standalones.set(name, standalone);
}
function getStandalone(name) {
  return standalones.get(name);
}
var standalones;
var init_workbench_standalone = __esm({
  "src/code/workbench/common/workbench.standalone.ts"() {
    standalones = /* @__PURE__ */ new Map();
  }
});

export {
  registerStandalone,
  getStandalone,
  init_workbench_standalone
};
