import React from "react";

import { useAppDispatch, useAppSelector } from "../../../../react-hooks/hooks";
import { MainContext } from "../../../../react-hooks/functions";
import { ReactComponent as PanelBottom } from "../../../../../assets/svg/layout-panel.svg";
import { setPanel, togglePanel } from "../../../../services/use_panel_buttons";
import { handle_set_settings } from "../../../../services/use_tabs_function";
import { handle_run_file } from "../../../../services/use_functions";

import Tooltip from "../components/tooltip";

import {
  CaretRightOutlined,
  LayoutOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons/lib";

import { Action, ActionSelector } from "../components/action_selector";
import { update_layout } from "../../../../react-hooks/state_manager";
import { ReactComponent as PanelBottomOff } from "../../../../../assets/svg/layout-panel-off.svg";

import { ReactComponent as PanelLeft } from "../../../../../assets/svg/layout-sidebar-left.svg";
import { ReactComponent as PanelLeftOff } from "../../../../../assets/svg/layout-sidebar-left-off.svg";

import { ReactComponent as PanelRight } from "../../../../../assets/svg/layout-panel-sidebar-right.svg";
import { ReactComponent as PanelRightOff } from "../../../../../assets/svg/layout-panel-sidebar-right-off.svg";

import { ReactComponent as Minimize } from "../../../../../assets/window-controls/minimize.svg";
import { ReactComponent as Restore } from "../../../../../assets/window-controls/restore.svg";

import { ReactComponent as Close } from "../../../../../assets/window-controls/close.svg";

import Logo from "../../../../../assets/logo.png";

export function TitlebarUI() {
  const [layout_action, set_layout_action] = React.useState<boolean>(false);
  const panel_state = useAppSelector((state) => state.main.panel_state);
  const { right_panel, left_panel, bottom_panel } = useAppSelector(
    (state) => state.main.panel_state
  );
  const active_file = useAppSelector((state) => state.main.active_file);
  const active_files = useAppSelector((state) => state.main.active_files);
  const project_options = useAppSelector((state) => state.main.project_options);
  const dispatch = useAppDispatch();

  const useMainContextIn = React.useContext(MainContext);

  const actions: Action[] = [
    { label: "Left", action: () => {} },
    { label: "Right", action: () => {} },
    { label: "Bottom", action: () => {} },
    { label: "", action: () => {}, type: "separator" },
    {
      label: "Layout 1",
      action: () => {
        dispatch(update_layout({ layout: "layout_1" }));
      },
    },
    {
      label: "Layout 2",
      action: () => {
        dispatch(update_layout({ layout: "layout_2" }));
      },
    },
    {
      label: "Layout 3",
      action: () => {
        dispatch(update_layout({ layout: "layout_3" }));
      },
    },
    {
      label: "Layout 4",
      action: () => {
        dispatch(update_layout({ layout: "layout_4" }));
      },
    },
  ];

  return (
    <div className="titlebar-wrapper">
      {layout_action && (
        <ActionSelector
          actions={actions}
          on_outside_click={() => set_layout_action(false)}
        />
      )}
      <div className="part">
        <div className="logo">
          <img src={Logo} alt="logo" />
        </div>
        <div className="menu"></div>
        <div className="project-info"></div>
      </div>
      <div className="part">
        <div className="commands">
          <Tooltip text="Run ( F12 )" position="bottom">
            <button
              onClick={() => {
                if (
                  active_files.length === 0 ||
                  !active_file?.path?.endsWith(".py")
                )
                  return;
                handle_run_file(
                  active_file,
                  setPanel,
                  dispatch,
                  panel_state,
                  project_options
                );
              }}
              className={`${
                active_files.length > 0 && active_file?.path?.endsWith(".py")
                  ? ""
                  : "disabled"
              }`}
            >
              <CaretRightOutlined />
            </button>
          </Tooltip>
        </div>
        <div className="panel-controls">
          <button onClick={() => togglePanel(dispatch, panel_state, "bottom")}>
            {bottom_panel ? (
              <Tooltip text="Toggle Panel ( Ctrl + ` )" position="bottom">
                <PanelBottom />
              </Tooltip>
            ) : (
              <Tooltip text="Toggle Panel ( Ctrl + ` )" position="bottom">
                <PanelBottomOff />
              </Tooltip>
            )}
          </button>

          <button onClick={() => togglePanel(dispatch, panel_state, "left")}>
            {left_panel ? (
              <Tooltip
                text="Toggle Primary Sidebar ( Ctrl + B )"
                position="bottom"
              >
                <PanelLeft />
              </Tooltip>
            ) : (
              <Tooltip
                text="Toggle Primary Sidebar ( Ctrl + B )"
                position="bottom"
              >
                <PanelLeftOff />
              </Tooltip>
            )}
          </button>

          <button onClick={() => togglePanel(dispatch, panel_state, "right")}>
            {right_panel ? (
              <Tooltip
                text="Toggle Right Panel ( Ctrl + Alt + B )"
                position="bottom"
              >
                <PanelRight />
              </Tooltip>
            ) : (
              <Tooltip
                text="Toggle Right Panel ( Ctrl + Alt + B )"
                position="bottom"
              >
                <PanelRightOff />
              </Tooltip>
            )}
          </button>
        </div>
        <div className="options">
          <button onClick={() => set_layout_action((prev) => !prev)}>
            <LayoutOutlined />
          </button>
          <button onClick={() => handle_set_settings(useMainContextIn)}>
            <SettingOutlined />
          </button>
          <button>
            <SearchOutlined />
          </button>
        </div>
        <div className="window-controls">
          <button className="button-minimize">
            <Minimize />
          </button>
          <button className="button-restore-maximize">
            <Restore />
          </button>
          <button className="button-close">
            <Close />
          </button>
        </div>
      </div>
    </div>
  );
}
