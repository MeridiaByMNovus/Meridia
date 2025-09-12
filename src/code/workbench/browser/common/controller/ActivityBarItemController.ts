import {
  update_active_activitybar_item,
  update_panel_state,
} from "../../../common/store/mainSlice.js";
import { select, watch } from "../../../common/store/selectors.js";
import { dispatch } from "../../../common/store/store.js";
import { ActivtyBarItemLayout } from "../../activityBarItemLayout.js";

export class ActivityBarItemController {
  private static panelWatcherInitialized: boolean = false;
  private static lastActiveByBar: Map<string, string> = new Map();

  constructor(private item: ActivtyBarItemLayout) {
    if (!ActivityBarItemController.panelWatcherInitialized) {
      ActivityBarItemController.panelWatcherInitialized = true;
      this.initializePanelWatcher();
    }

    this.item.elementEl!.onclick = () => {
      if (this.item.content && this.item.contentWrapper) {
        const active = select(
          (s) =>
            s.main.active_activityBaritem[this.item.ActivityBar.position]?.[
              this.item.position
            ]
        );
        const panelState = select((s) => s.main.panel_state);

        let togglePanelSide: "left" | "right" | "bottom" = "left";
        if (this.item.position === "bottom") {
          togglePanelSide = "bottom";
        } else if (
          this.item.position === "top" &&
          this.item.ActivityBar.position === "right"
        ) {
          togglePanelSide = "right";
        } else if (
          this.item.position === "top" &&
          this.item.ActivityBar.position === "left"
        ) {
          togglePanelSide = "left";
        }

        if (active === this.item.id) {
          // Deactivate item and close relevant panel side
          dispatch(
            update_active_activitybar_item({
              bar: this.item.ActivityBar.position,
              position: this.item.position,
              id: "",
            })
          );

          dispatch(
            update_panel_state({
              ...panelState,
              [togglePanelSide]: "off",
            })
          );
        } else {
          // Activate item and open relevant panel side
          dispatch(
            update_active_activitybar_item({
              bar: this.item.ActivityBar.position,
              position: this.item.position,
              id: this.item.id,
            })
          );

          dispatch(
            update_panel_state({
              ...panelState,
              [togglePanelSide]: "on",
            })
          );
        }

        this.updateContent();
      }

      if (this.item.onClickHook) {
        this.item.onClickHook();
      }
    };

    if (
      this.item.activeByDefault &&
      this.item.content &&
      this.item.contentWrapper
    ) {
      dispatch(
        update_active_activitybar_item({
          bar: this.item.ActivityBar.position,
          position: this.item.position,
          id: this.item.id,
        })
      );
      ActivityBarItemController.lastActiveByBar.set(
        `${this.item.ActivityBar.position}-${this.item.position}`,
        this.item.id
      );
    }

    if (this.item.content && this.item.contentWrapper) {
      const active = select(
        (s) =>
          s.main.active_activityBaritem[this.item.ActivityBar.position]?.[
            this.item.position
          ]
      );
      if (active === this.item.id) {
        this.setActive(true, this.item.elementEl!);
        this.updateContent();
      }

      watch(
        (s) =>
          s.main.active_activityBaritem[this.item.ActivityBar.position]?.[
            this.item.position
          ],
        (next) => {
          const isActive = next === this.item.id;

          this.setActive(isActive, this.item.getDomElement()!);

          if (isActive && this.item.content && this.item.contentWrapper) {
            this.item.contentWrapper.innerHTML = "";
            this.item.contentWrapper.appendChild(this.item.content);
          }
        }
      );
    }
  }

  private initializePanelWatcher() {
    watch(
      (s) => s.main.panel_state,
      (next, prev) => {
        (["left", "right"] as Array<"left" | "right">).forEach((side) => {
          if (next[side] === "off") {
            const activeBar = select(
              (s) => s.main.active_activityBaritem[side]
            );

            const currentActiveTop = activeBar?.top;
            const currentActiveBottom = activeBar?.bottom;

            if (currentActiveTop) {
              ActivityBarItemController.lastActiveByBar.set(
                `${side}-top`,
                currentActiveTop
              );
            }
            if (currentActiveBottom) {
              ActivityBarItemController.lastActiveByBar.set(
                `${side}-bottom`,
                currentActiveBottom
              );
            }

            dispatch(
              update_active_activitybar_item({
                bar: side,
                position: "top",
                id: "",
              })
            );
            dispatch(
              update_active_activitybar_item({
                bar: side,
                position: "bottom",
                id: "",
              })
            );
          } else if (prev?.[side] === "off" && next[side] === "on") {
            const lastActiveTop = ActivityBarItemController.lastActiveByBar.get(
              `${side}-top`
            );
            const lastActiveBottom =
              ActivityBarItemController.lastActiveByBar.get(`${side}-bottom`);

            if (lastActiveTop) {
              dispatch(
                update_active_activitybar_item({
                  bar: side,
                  position: "top",
                  id: lastActiveTop,
                })
              );
            }
            if (lastActiveBottom) {
              dispatch(
                update_active_activitybar_item({
                  bar: side,
                  position: "bottom",
                  id: lastActiveBottom,
                })
              );
            }
          }
        });
      }
    );
  }

  private updateContent() {
    if (this.item.content && this.item.contentWrapper) {
      this.item.contentWrapper.innerHTML = "";
      this.item.contentWrapper.appendChild(this.item.content);
    }
  }

  private setActive(isActive: boolean, item: HTMLDivElement) {
    if (isActive) item.classList.add("active");
    else item.classList.remove("active");
  }
}
