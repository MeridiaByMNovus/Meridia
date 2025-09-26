import {
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/event/workbench.event.statusbar.ts
function registerStatusbarItem(item) {
  const _data = { message: item, userId: Date.now() };
  const _event = new CustomEvent("workbench.statusbar.register.item", {
    detail: _data
  });
  document.dispatchEvent(_event);
}
var StatusbarEventListner, _statusbarEventListner;
var init_workbench_event_statusbar = __esm({
  "src/code/workbench/event/workbench.event.statusbar.ts"() {
    init_workbench_standalone();
    StatusbarEventListner = class {
      constructor() {
        this.startListening();
      }
      startListening() {
        document.addEventListener("workbench.statusbar.register.item", (_event) => {
          const statusbarEl = document.querySelector(
            ".statusbar"
          );
          const itemSectionEl = statusbarEl.querySelector(".item-section");
          const _customEvent = _event;
          const _item = _customEvent.detail.message;
          console.log(itemSectionEl, _item);
          itemSectionEl?.appendChild(_item);
        });
      }
    };
    _statusbarEventListner = new StatusbarEventListner();
    registerStandalone("statusbar-event-listner", _statusbarEventListner);
  }
});

export {
  registerStatusbarItem,
  StatusbarEventListner,
  _statusbarEventListner,
  init_workbench_event_statusbar
};
