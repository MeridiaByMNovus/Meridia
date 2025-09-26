import { registerStandalone } from "../common/workbench.standalone.js";

export function registerStatusbarItem(item: HTMLSpanElement) {
  const _data = { message: item, userId: Date.now() };
  const _event = new CustomEvent("workbench.statusbar.register.item", {
    detail: _data,
  });
  document.dispatchEvent(_event);
}

export class StatusbarEventListner {
  constructor() {
    this.startListening();
  }

  startListening() {
    document.addEventListener("workbench.statusbar.register.item", (_event) => {
      const statusbarEl = document.querySelector(
        ".statusbar"
      ) as HTMLDivElement;
      const itemSectionEl = statusbarEl.querySelector(".item-section");

      const _customEvent = _event as CustomEvent;
      const _item = _customEvent.detail.message;

      console.log(itemSectionEl, _item);

      itemSectionEl?.appendChild(_item);
    });
  }
}

export const _statusbarEventListner = new StatusbarEventListner();
registerStandalone("statusbar-event-listner", _statusbarEventListner);
