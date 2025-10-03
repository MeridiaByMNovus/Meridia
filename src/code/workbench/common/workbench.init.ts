import { Run } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.run.js";
import { Terminal } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.terminal.js";
import { mount } from "../event/workbench.event.editor.js";
import { setPanelVisibilty } from "../event/workbench.event.panel.js";
import { changePanelOptionsWidth } from "../event/workbench.event.panel.options.js";
import { addCommand } from "./workbench.command.js";
import { _xtermManager } from "./workbench.dev.panel/workbench.dev.panel.spawn.xterm.js";
import { getStandalone } from "./workbench.standalone.js";
import { watch } from "./workbench.store/workbench.store.selector.js";

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    changePanelOptionsWidth();
    _xtermManager._update();
  }
});

resizeObserver.observe(document.body);

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
