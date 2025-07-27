import { update_active_sidebaritem } from "../../common/store/mainSlice.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch } from "../../common/store/store.js";
import { Sidebar } from "./sidebarLayout.js";

export class SidebarItemLayout {
  constructor(
    private sidebar: Sidebar,
    private icon: string,
    private id: string,
    private content: HTMLDivElement,
    private contentWrapper: HTMLDivElement,
    private position: "top" | "bottom",
    private activeByDefault: boolean
  ) {
    this.render();
  }

  private render() {
    const item = document.createElement("div");
    item.classList.add("sidebar-item-wrapper");
    item.innerHTML = this.icon;
    item.onclick = () => {
      dispatch(update_active_sidebaritem(this.id));

      this.contentWrapper.innerHTML = "";
      this.contentWrapper.appendChild(this.content);
    };

    if (this.activeByDefault) {
      dispatch(update_active_sidebaritem(this.id));
      this.contentWrapper.innerHTML = "";
      this.contentWrapper.appendChild(this.content);
    }

    const active = select((s) => s.main.active_sidebaritem);

    if (active === this.id) {
      this.setActive(true, item);
    }

    watch(
      (s) => s.main.active_sidebaritem,
      (next) => {
        const isActive = next === this.id;
        this.setActive(isActive, item);
      }
    );

    this.sidebar.addSidebarItem(item, this.position);
  }

  private setActive(isActive: boolean, item: HTMLDivElement) {
    item.classList.toggle("active", isActive);
    if (isActive) {
    }
  }
}
