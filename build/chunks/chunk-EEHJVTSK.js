import {
  init_workbench_store,
  store
} from "./chunk-FPULJOSR.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.store/workbench.store.selector.ts
var select, watch;
var init_workbench_store_selector = __esm({
  "src/code/workbench/common/workbench.store/workbench.store.selector.ts"() {
    init_workbench_store();
    select = (fn) => fn(store.getState());
    watch = (selector, cb, eq = Object.is) => {
      let prev = selector(store.getState());
      return store.subscribe(() => {
        const next = selector(store.getState());
        if (!eq(next, prev)) {
          const p = prev;
          prev = next;
          cb(next, p);
        }
      });
    };
  }
});

export {
  select,
  watch,
  init_workbench_store_selector
};
