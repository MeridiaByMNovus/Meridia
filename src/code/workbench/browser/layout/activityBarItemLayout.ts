import {
  update_active_activitybar_item,
  update_panel_state,
} from "../../common/store/mainSlice.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch } from "../../common/store/store.js";
import { ActivityBar } from "./activityBarLayout.js";
import { ElementCore } from "./elementCore.js";

export class ActivtyBarItemLayout extends ElementCore {
  private static panelWatcherInitialized: boolean = false;
  private static lastActiveByBar: Map<string, string> = new Map();

  constructor(
    private ActivityBar: ActivityBar,
    private icon: string,
    private id: string,
    private content?: HTMLDivElement,
    private contentWrapper?: HTMLDivElement,
    private position: "top" | "bottom" = "top",
    private activeByDefault: boolean = false,
    private onClickHook?: Function
  ) {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.classList.add("activity-bar-item");
    this.elementEl.innerHTML = this.icon;

    if (!ActivtyBarItemLayout.panelWatcherInitialized) {
      ActivtyBarItemLayout.panelWatcherInitialized = true;
      this.initializePanelWatcher();
    }

    this.elementEl.onclick = () => {
      if (this.content && this.contentWrapper) {
        const active = select(
          (s) => s.main.active_activityBaritem[this.ActivityBar.position]
        );
        const panelState = select((s) => s.main.panel_state);

        if (
          active === this.id &&
          panelState[this.ActivityBar.position] === "on"
        ) {
          dispatch(
            update_panel_state({
              ...panelState,
              [this.ActivityBar.position]: "off",
            })
          );
          dispatch(
            update_active_activitybar_item({
              bar: this.ActivityBar.position,
              id: "",
            })
          );
          return;
        }

        dispatch(
          update_active_activitybar_item({
            bar: this.ActivityBar.position,
            id: this.id,
          })
        );
        this.updateContent();

        if (panelState[this.ActivityBar.position] === "off") {
          dispatch(
            update_panel_state({
              ...panelState,
              [this.ActivityBar.position]: "on",
            })
          );
        }
      }

      if (this.onClickHook) {
        this.onClickHook();
      }
    };

    if (this.activeByDefault && this.content && this.contentWrapper) {
      dispatch(
        update_active_activitybar_item({
          bar: this.ActivityBar.position,
          id: this.id,
        })
      );
      this.updateContent();
      ActivtyBarItemLayout.lastActiveByBar.set(
        this.ActivityBar.position,
        this.id
      );
    }

    if (this.content && this.contentWrapper) {
      const active = select(
        (s) => s.main.active_activityBaritem[this.ActivityBar.position]
      );
      if (active === this.id) {
        this.setActive(true, this.elementEl);
      }

      watch(
        (s) => s.main.active_activityBaritem[this.ActivityBar.position],
        (next) => {
          const isActive = next === this.id;
          this.setActive(isActive, this.elementEl as HTMLDivElement);
          if (isActive && this.content && this.contentWrapper) {
            this.contentWrapper.innerHTML = "";
            this.contentWrapper.appendChild(this.content);
          }
        }
      );
    }

    this.ActivityBar.addActivityBarItem(this.elementEl, this.position);
  }

  private initializePanelWatcher() {
    watch(
      (s) => s.main.panel_state,
      (next, prev) => {
        (["left", "right"] as Array<"left" | "right">).forEach((side) => {
          if (next[side] === "off") {
            const currentActive = select(
              (s) => s.main.active_activityBaritem[side as "left" | "right"]
            );
            if (currentActive) {
              ActivtyBarItemLayout.lastActiveByBar.set(side, currentActive);
            }
            dispatch(update_active_activitybar_item({ bar: side, id: "" }));
          } else if (prev?.[side] === "off" && next[side] === "on") {
            const lastActive = ActivtyBarItemLayout.lastActiveByBar.get(side);
            if (lastActive) {
              dispatch(
                update_active_activitybar_item({ bar: side, id: lastActive })
              );
            }
          }
        });
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
