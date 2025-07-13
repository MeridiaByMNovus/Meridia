import { update_layout } from "../helpers/state_manager";

export function togglePanel(
  dispatch: any,
  layout: { left_panel: boolean; right_panel: boolean; bottom_panel: boolean },
  panel: "left" | "right" | "bottom"
) {
  const { left_panel, right_panel, bottom_panel } = layout;

  dispatch(
    update_layout({
      left_panel: panel === "left" ? !left_panel : left_panel,
      right_panel: panel === "right" ? !right_panel : right_panel,
      bottom_panel: panel === "bottom" ? !bottom_panel : bottom_panel,
    })
  );
}

export function setPanel(
  dispatch: any,
  layout: { left_panel: boolean; right_panel: boolean; bottom_panel: boolean },
  panel: "left" | "right" | "bottom",
  value: boolean
) {
  const { left_panel, right_panel, bottom_panel } = layout;

  dispatch(
    update_layout({
      left_panel: panel === "left" ? value : left_panel,
      right_panel: panel === "right" ? value : right_panel,
      bottom_panel: panel === "bottom" ? value : bottom_panel,
    })
  );
}
