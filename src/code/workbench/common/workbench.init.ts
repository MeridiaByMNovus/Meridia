import { mount } from "../event/workbench.event.editor.js";
import { setPanelVisibilty } from "../event/workbench.event.panel.js";
import { changePanelOptionsWidth } from "../event/workbench.event.panel.options.js";
import { watch } from "./workbench.store/workbench.store.selector.js";

watch(
  (s) => s.main.panel_state,
  (next) => {
    const _leftEl = document.querySelector(".left-panel") as HTMLDivElement;
    const _rightEl = document.querySelector(".right-panel") as HTMLDivElement;
    const _bottomEl = document.querySelector(".bottom-panel") as HTMLDivElement;
    setPanelVisibilty(_leftEl, next.left);
    setPanelVisibilty(_rightEl, next.right);
    setPanelVisibilty(_bottomEl, next.bottom);
  }
);

setTimeout(() => {
  mount();
  changePanelOptionsWidth();
}, 100);
