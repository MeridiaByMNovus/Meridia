import {
  update_active_activitybar_item,
  update_panel_state,
} from "../../common/store/mainSlice.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch } from "../../common/store/store.js";
import { ActivityBar } from "./activityBarLayout.js";

export class ActivtyBarItemLayout {
  private static lastActiveItem: string = "";
  private static panelWatcherInitialized: boolean = false;

  constructor(
    private ActivtyBar: ActivityBar,
    private icon: string,
    private id: string,
    private content?: HTMLDivElement,
    private contentWrapper?: HTMLDivElement,
    private position: "top" | "bottom" = "top",
    private activeByDefault: boolean = false,
    private onClickHook?: Function
  ) {
    this.render();
  }

  private render() {
    const item = document.createElement("div");
    item.classList.add("activity-bar-item");
    item.innerHTML = this.icon;

    if (!ActivtyBarItemLayout.panelWatcherInitialized) {
      ActivtyBarItemLayout.panelWatcherInitialized = true;
      this.initializePanelWatcher();
    }

    item.onclick = () => {
      if (this.content && this.contentWrapper) {
        const active = select((s) => s.main.active_activityBaritem);
        const { left, right, bottom } = select((s) => s.main.panel_state);

        if (active === this.id && left === "on") {
          dispatch(update_panel_state({ left: "off", right, bottom }));
          dispatch(update_active_activitybar_item(""));
          return;
        }

        dispatch(update_active_activitybar_item(this.id));
        this.updateContent();

        if (left === "off") {
          dispatch(update_panel_state({ left: "on", right, bottom }));
        }
      }

      if (this.onClickHook) {
        this.onClickHook();
      }
    };

    if (this.activeByDefault && this.content && this.contentWrapper) {
      dispatch(update_active_activitybar_item(this.id));
      this.updateContent();
      ActivtyBarItemLayout.lastActiveItem = this.id;
    }

    if (this.content && this.contentWrapper) {
      const active = select((s) => s.main.active_activityBaritem);

      if (active === this.id) {
        this.setActive(true, item);
      }

      watch(
        (s) => s.main.active_activityBaritem,
        (next) => {
          const isActive = next === this.id;
          this.setActive(isActive, item);

          if (isActive && this.content && this.contentWrapper) {
            this.updateContent();
          }
        }
      );
    }

    this.ActivtyBar.addActivityBarItem(item, this.position);
  }

  private initializePanelWatcher() {
    watch(
      (s) => s.main.panel_state,
      (next, prev) => {
        if (next.left === "off") {
          const currentActive = select((s) => s.main.active_activityBaritem);
          if (currentActive) {
            ActivtyBarItemLayout.lastActiveItem = currentActive;
          }
          dispatch(update_active_activitybar_item(""));
        } else if (prev?.left === "off" && next.left === "on") {
          if (ActivtyBarItemLayout.lastActiveItem) {
            dispatch(
              update_active_activitybar_item(
                ActivtyBarItemLayout.lastActiveItem
              )
            );
          } else {
          }
        }
      }
    );
  }

  private updateContent() {
    if (this.content && this.contentWrapper) {
      this.contentWrapper.innerHTML = "";
      this.contentWrapper.appendChild(this.content);
    }
  }

  private setActive(isActive: boolean, item: HTMLDivElement) {
    item.classList.toggle("active", isActive);
  }

  public get itemId(): string {
    return this.id;
  }

  public get isActiveByDefault(): boolean {
    return this.activeByDefault;
  }
}
