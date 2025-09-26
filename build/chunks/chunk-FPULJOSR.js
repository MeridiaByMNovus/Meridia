import {
  configureStore,
  init_redux_toolkit_modern,
  init_workbench_store_slice,
  workbench_store_slice_default
} from "./chunk-EWJVXHY4.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.store/workbench.store.ts
var store, dispatch;
var init_workbench_store = __esm({
  "src/code/workbench/common/workbench.store/workbench.store.ts"() {
    init_redux_toolkit_modern();
    init_workbench_store_slice();
    store = configureStore({
      reducer: {
        main: workbench_store_slice_default
      }
    });
    dispatch = store.dispatch;
  }
});

export {
  store,
  dispatch,
  init_workbench_store
};
