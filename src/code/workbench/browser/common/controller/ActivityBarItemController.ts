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
            s.main.active_activityBaritem[this.item.ActivityBar.position][
              this.item.position
            ]
        );
        const panelState = select((s) => s.main.panel_state);

        if (active === this.item.id) {
          if (panelState[this.item.ActivityBar.position] === "on") {
            dispatch(
              update_active_activitybar_item({
                bar: this.item.ActivityBar.position,
                position: this.item.position,
                id: "",
              })
            );

            this.setActive(false, this.item.elementEl!);

            const otherPosition =
              this.item.position === "top" ? "bottom" : "top";
            const otherActive = select(
              (s) =>
                s.main.active_activityBaritem[this.item.ActivityBar.position][
                  otherPosition
                ]
            );

            if (!otherActive || otherActive === "") {
              dispatch(
                update_panel_state({
                  ...panelState,
                  [this.item.ActivityBar.position]: "off",
                })
              );
            }
            return;
          } else {
            dispatch(
              update_panel_state({
                ...panelState,
                [this.item.ActivityBar.position]: "on",
              })
            );

            return;
          }
        }

        dispatch(
          update_active_activitybar_item({
            bar: this.item.ActivityBar.position,
            position: this.item.position,
            id: this.item.id,
          })
        );

        if (panelState[this.item.ActivityBar.position] === "off") {
          dispatch(
            update_panel_state({
              ...panelState,
              [this.item.ActivityBar.position]: "on",
            })
          );
        }
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
          s.main.active_activityBaritem[this.item.ActivityBar.position][
            this.item.position
          ]
      );
      if (active === this.item.id) {
        this.setActive(true, this.item.elementEl!);
        this.updateContent();
      }

      watch(
        (s) =>
          s.main.active_activityBaritem[this.item.ActivityBar.position][
            this.item.position
          ],
        (next) => {
          const isActive = next === this.item.id;
          this.setActive(isActive, this.item.elementEl as HTMLDivElement);

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
            const currentActiveTop = select(
              (s) => s.main.active_activityBaritem[side]["top"]
            );
            const currentActiveBottom = select(
              (s) => s.main.active_activityBaritem[side]["bottom"]
            );

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
    item.classList.toggle("active", isActive);
  }
}
