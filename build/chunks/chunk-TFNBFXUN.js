import {
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/event/workbench.event.panel.options.ts
function changePanelOptionsWidth() {
  const _data = { userId: Date.now() };
  const _event = new CustomEvent("workbench.panel.options.change.width", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
var PanelOptionsEventListner, _panelOptionsEventListner;
var init_workbench_event_panel_options = __esm({
  "src/code/workbench/event/workbench.event.panel.options.ts"() {
    init_workbench_standalone();
    PanelOptionsEventListner = class {
      constructor() {
        this.startListening();
      }
      startListening() {
        document.addEventListener(
          "workbench.panel.options.change.width",
          (_event) => {
            const leftPanelOptionEl = document.querySelector(
              ".left-panel-options"
            );
            const rightPanelOptionEl = document.querySelector(
              ".right-panel-options"
            );
            const leftPanel = document.querySelector(
              ".left-panel"
            );
            const rightPanel = document.querySelector(
              ".right-panel"
            );
            leftPanelOptionEl.style.width = leftPanel.clientWidth + "px";
            rightPanelOptionEl.style.width = rightPanel.clientWidth + "px";
            if (leftPanel.clientWidth < 30) {
              leftPanelOptionEl.style.visibility = "hidden";
            } else {
              leftPanelOptionEl.style.visibility = "visible";
            }
            if (rightPanel.clientWidth < 30) {
              rightPanelOptionEl.style.visibility = "hidden";
              return;
            } else {
              rightPanelOptionEl.style.visibility = "visible";
            }
          }
        );
      }
    };
    _panelOptionsEventListner = new PanelOptionsEventListner();
    registerStandalone("panel-options-event-listner", _panelOptionsEventListner);
  }
});

export {
  changePanelOptionsWidth,
  PanelOptionsEventListner,
  _panelOptionsEventListner,
  init_workbench_event_panel_options
};
