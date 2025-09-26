import {
  changePanelOptionsWidth,
  init_workbench_event_panel_options
} from "./chunk-TFNBFXUN.js";
import {
  getStandalone,
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/event/workbench.event.panel.ts
function togglePanelVisibilty(_panel) {
  const _data = { message: _panel, userId: Date.now() };
  const _event = new CustomEvent("workbench.panel.toggle.visibilty", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
function setPanelVisibilty(_panel, visibilty) {
  const _data = {
    message: { panel: _panel, visibilty },
    userId: Date.now()
  };
  const _event = new CustomEvent("workbench.panel.set.visibilty", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
var PanelEventListner, _panelEventListner;
var init_workbench_event_panel = __esm({
  "src/code/workbench/event/workbench.event.panel.ts"() {
    init_workbench_standalone();
    init_workbench_event_panel_options();
    PanelEventListner = class {
      constructor() {
        this.startListening();
      }
      startListening() {
        document.addEventListener("workbench.panel.toggle.visibilty", (_event) => {
          const _customEvent = _event;
          const _panel = _customEvent.detail.message;
          if (!_panel) return;
          const _splitterVertical = getStandalone(
            "panel-splitter-vertical"
          );
          const _splitterHorizontal = getStandalone(
            "panel-splitter-horizontal"
          );
          if (!_splitterVertical && !_splitterHorizontal) return;
          const _indexNumberVertical = _splitterVertical.getIndex(_panel);
          const _indexNumberHorizontal = _splitterHorizontal.getIndex(_panel);
          _splitterVertical.togglePanel(_indexNumberVertical);
          _splitterHorizontal.togglePanel(_indexNumberHorizontal);
          changePanelOptionsWidth();
        });
        document.addEventListener("workbench.panel.set.visibilty", (_event) => {
          const _customEvent = _event;
          const _data = _customEvent.detail.message;
          const _panel = _data.panel;
          const _visiblity = _data.visibilty;
          if (!_panel) return;
          const _splitterVertical = getStandalone(
            "panel-splitter-vertical"
          );
          const _splitterHorizontal = getStandalone(
            "panel-splitter-horizontal"
          );
          if (!_splitterVertical && !_splitterHorizontal) return;
          const _indexNumberVertical = _splitterVertical.getIndex(_panel);
          const _indexNumberHorizontal = _splitterHorizontal.getIndex(_panel);
          _splitterVertical.setPanel(_indexNumberVertical, _visiblity);
          _splitterHorizontal.setPanel(_indexNumberHorizontal, _visiblity);
          changePanelOptionsWidth();
        });
      }
    };
    _panelEventListner = new PanelEventListner();
    registerStandalone("panel-event-listner", _panelEventListner);
  }
});

export {
  togglePanelVisibilty,
  setPanelVisibilty,
  PanelEventListner,
  _panelEventListner,
  init_workbench_event_panel
};
