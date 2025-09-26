import {
  init_perfect_scrollbar_esm,
  perfect_scrollbar_esm_default
} from "./chunk-VKGV2SFM.js";
import {
  __commonJS
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.scrollbar.ts
var require_workbench_scrollbar = __commonJS({
  "src/code/workbench/common/workbench.scrollbar.ts"() {
    init_perfect_scrollbar_esm();
    var _scrollbarEl = document.querySelectorAll(".scrollbar-container");
    var _scrollbars = [];
    _scrollbarEl.forEach((_el) => {
      const yDisable = _el.classList.contains("y-disable");
      const xDisable = _el.classList.contains("x-disable");
      const _scrollbar = new perfect_scrollbar_esm_default(_el, {
        suppressScrollX: xDisable,
        suppressScrollY: yDisable,
        useBothWheelAxes: true,
        wheelPropagation: false
      });
      _scrollbars.push(_scrollbar);
      let updateTimeout;
      const debouncedUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          _scrollbar.update();
        }, 16);
      };
      const mutationObserver = new MutationObserver((mutations) => {
        const hasRelevantChanges = mutations.some(
          (mutation) => mutation.type === "childList" || mutation.type === "attributes" && mutation.attributeName === "style" && mutation.target.style.height !== void 0
        );
        if (hasRelevantChanges) {
          debouncedUpdate();
        }
      });
      mutationObserver.observe(_el, {
        childList: false,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
        attributeOldValue: false
      });
    });
  }
});

export {
  require_workbench_scrollbar
};
