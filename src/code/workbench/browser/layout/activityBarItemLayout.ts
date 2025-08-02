import { update_active_activitybar_item } from "../../common/store/mainSlice.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch } from "../../common/store/store.js";
import { ActivityBar } from "./activityBarLayout.js";

export class ActivtyBarItemLayout {
  constructor(
    private ActivtyBar: ActivityBar,
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
    item.classList.add("activity-bar-item");
    item.innerHTML = this.icon;
    item.onclick = () => {
      dispatch(update_active_activitybar_item(this.id));

      this.contentWrapper.innerHTML = "";
      this.contentWrapper.appendChild(this.content);
    };

    if (this.activeByDefault) {
      dispatch(update_active_activitybar_item(this.id));
      this.contentWrapper.innerHTML = "";
      this.contentWrapper.appendChild(this.content);
    }

    const active = select((s) => s.main.active_activityBaritem);

    if (active === this.id) {
      this.setActive(true, item);
    }

    watch(
      (s) => s.main.active_activityBaritem,
      (next) => {
        const isActive = next === this.id;
        this.setActive(isActive, item);
      }
    );

    this.ActivtyBar.addActivityBarItem(item, this.position);
  }

  private setActive(isActive: boolean, item: HTMLDivElement) {
    item.classList.toggle("active", isActive);
    if (isActive) {
    }
  }
}
