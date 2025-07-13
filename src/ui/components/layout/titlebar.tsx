import React from "react";

import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import { MainContext } from "../../../helpers/functions";
import { setPanel, togglePanel } from "../../../hooks/use_panel_buttons";
import { handle_set_settings } from "../../../hooks/use_tabs_function";
import { handle_run_file } from "../../../hooks/use_functions";

import Tooltip from "../../components/tooltip";

import {
  CaretRightOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons/lib";

import { ReactComponent as PanelBottom } from "../../../assets/svg/layout-panel.svg";
import { ReactComponent as PanelBottomOff } from "../../../assets/svg/layout-panel-off.svg";

import { ReactComponent as PanelLeft } from "../../../assets/svg/layout-sidebar-left.svg";
import { ReactComponent as PanelLeftOff } from "../../../assets/svg/layout-sidebar-left-off.svg";

import { ReactComponent as PanelRight } from "../../../assets/svg/layout-panel-sidebar-right.svg";
import { ReactComponent as PanelRightOff } from "../../../assets/svg/layout-panel-sidebar-right-off.svg";

import { ReactComponent as Minimize } from "../../../assets/window-controls/minimize.svg";
import { ReactComponent as Restore } from "../../../assets/window-controls/restore.svg";

import { ReactComponent as Close } from "../../../assets/window-controls/close.svg";

import Logo from "../../../assets/logo.png";

export function TitlebarUI() {
  const layout = useAppSelector((state) => state.main.layout);
  const { right_panel, left_panel, bottom_panel } = useAppSelector(
    (state) => state.main.layout
  );
  const active_file = useAppSelector((state) => state.main.active_file);
  const active_files = useAppSelector((state) => state.main.active_files);
  const dispatch = useAppDispatch();

  const useMainContextIn = React.useContext(MainContext);

  return (
    <div className="titlebar-wrapper">
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
                handle_run_file(active_file, setPanel, dispatch, layout);
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
          <button onClick={() => togglePanel(dispatch, layout, "bottom")}>
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

          <button onClick={() => togglePanel(dispatch, layout, "left")}>
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

          <button onClick={() => togglePanel(dispatch, layout, "right")}>
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
          <button onClick={() => handle_set_settings(useMainContextIn)}>
            <SettingOutlined />
          </button>
          <button>
            <SearchOutlined />
          </button>
        </div>
        <div className="window-controls">
          <button>
            <Minimize />
          </button>
          <button>
            <Restore />
          </button>
          <button>
            <Close />
          </button>
        </div>
      </div>
    </div>
  );
}
