import React from "react";
import { useAppSelector } from "../../../helpers/hooks";

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

import { MainContext } from "../../../helpers/functions";

export function TitlebarUI() {
  const sidebar_active = useAppSelector((state) => state.main.sidebar_active);
  const right_sidebar_active = useAppSelector(
    (state) => state.main.right_sidebar_active
  );
  const bottom_panel_active = useAppSelector(
    (state) => state.main.bottom_panel_active
  );

  const useMainContextIn = React.useContext(MainContext);

  function handle_set_settings() {
    useMainContextIn.handle_set_tab({
      name: "Settings",
      id: "settings",
      icon: "icons/file_type_python.svg",
      component: "Settings",
      props: null,
    });
  }

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
          <Tooltip text="Run ( F12 )">
            <button className="run-button">
              <CaretRightOutlined />
            </button>
          </Tooltip>
        </div>
        <div className="panel-controls">
          <button>
            {bottom_panel_active ? (
              <Tooltip text="Toggle Panel ( Ctrl + ` )" position="bottom">
                <PanelBottom />
              </Tooltip>
            ) : (
              <Tooltip text="Toggle Panel ( Ctrl + ` )" position="bottom">
                <PanelBottomOff />
              </Tooltip>
            )}
          </button>

          <button>
            {sidebar_active ? (
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

          <button>
            {right_sidebar_active ? (
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
          <button onClick={handle_set_settings}>
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
