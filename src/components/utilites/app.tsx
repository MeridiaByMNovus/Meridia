import React, { useEffect, useState } from "react";
import { Splitter } from "antd";
import PerfectScrollbar from "react-perfect-scrollbar";
import { FolderOutlined, SettingOutlined } from "@ant-design/icons";

import Header from "../layout/header";
import FooterComponent from "../layout/footer";
import ContentSection from "../layout/content";
import { BottomTabs } from "../bottom-tabs";
import { VariableSection } from "../layout/variable";
import Folders from "../sidebar/folders";
import NewProject from "../new-project";

import Tooltip from "../../../support/ui-kit/tooltip/Tooltip";
import { useAppDispatch, useAppSelector } from "../../helpers/hooks";
import {
  update_active_file,
  update_active_files,
  update_sidebar_active,
} from "../../helpers/state-manager";
import { store } from "../../helpers/store";
import { PluginAPI } from "../../../plugins/api/pluginAPI";
import { ReactComponent as StudioIcon } from "../../assets/files/remote.svg";

import "./index.css";

const iconMap = {
  Folders: <FolderOutlined />,
  Settings: <SettingOutlined />,
  "Meridia Studio": <StudioIcon />,
};

const App = () => {
  const dispatch = useAppDispatch();
  const sidebarActive = useAppSelector((state) => state.main.sidebar_active);
  const rightPanelActive = useAppSelector(
    (state) => state.main.right_sidebar_active
  );
  const bottomPanelActive = useAppSelector(
    (state) => state.main.bottom_panel_active
  );

  const [newProjectActive, setNewProjectActive] = useState(false);
  const [pluginContent, setPluginContent] = useState(null);

  const handleNewProject = () => setNewProjectActive((prev) => !prev);

  const openFile = (file: any) => {
    const currentFiles = [...store.getState().main.active_files];
    const index = currentFiles.findIndex((f) => f.name === file.name);

    if (index === -1) {
      currentFiles.push(file);
      dispatch(update_active_files(currentFiles));
    }
    dispatch(update_active_file(file));
  };

  const openSettings = () =>
    openFile({
      path: "/settings",
      name: "Settings",
      icon: "settings",
      is_touched: false,
      content: "",
    });
  const openMeridiaStudio = () =>
    openFile({
      path: "/studio",
      name: "Studio",
      icon: "Studio",
      is_touched: false,
      content: "",
    });

  useEffect(() => {
    window.electron.ipcRenderer.on("open-settings", openSettings);
    window.electron.ipcRenderer.on("new-project", handleNewProject);
    window.electron.ipcRenderer.on("open-meridia-studio", openMeridiaStudio);

    return () => {
      window.electron.ipcRenderer.removeListener("open-settings", openSettings);
      window.electron.ipcRenderer.removeListener(
        "new-project",
        handleNewProject
      );
      window.electron.ipcRenderer.removeListener(
        "open-meridia-studio",
        openMeridiaStudio
      );
    };
  }, []);

  const handlePluginClick = (iconId: any) => {
    setPluginContent(PluginAPI.sidebarContent[iconId] || null);
  };

  return (
    <div
      className="wrapper-component"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <Header />

      <div className="middle-section" style={{ flex: 1, display: "flex" }}>
        <Splitter style={{ flex: 1, display: "flex", flexDirection: "row" }}>
          {/* Sidebar */}
          <Splitter.Panel
            defaultSize="20%"
            size={sidebarActive ? undefined : "0%"}
            collapsible
            max="90%"
            style={{
              borderRight: sidebarActive
                ? "1px solid var(--main-border-color)"
                : "none",
              height: "100%",
            }}
          >
            <PerfectScrollbar
              options={{ suppressScrollX: true }}
              style={{ maxHeight: "100%", overflow: "auto" }}
            >
              <Folders />
            </PerfectScrollbar>
          </Splitter.Panel>

          {/* Center Panel: Content + Bottom Tabs */}
          <Splitter.Panel>
            <Splitter layout="vertical">
              {/* Main Content */}
              <Splitter.Panel>
                {newProjectActive && <NewProject />}
                <ContentSection />
              </Splitter.Panel>

              {/* Bottom Tabs */}
              <Splitter.Panel
                defaultSize="30%"
                size={bottomPanelActive ? undefined : "0%"}
                min="10%"
                max="90%"
                collapsible
                className="terminal"
                style={{
                  borderTop: "1px solid var(--main-border-color)",
                  background: "#1e1e1e",
                }}
              >
                <BottomTabs />
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>

          {/* Variable Section */}
          <Splitter.Panel
            defaultSize="20%"
            size={rightPanelActive ? undefined : "0%"}
            collapsible
            max="90%"
            style={{
              borderLeft: rightPanelActive
                ? "1px solid var(--main-border-color)"
                : "none",
              height: "100%",
            }}
          >
            <PerfectScrollbar>
              <VariableSection />
            </PerfectScrollbar>
          </Splitter.Panel>
        </Splitter>
      </div>

      <FooterComponent />
    </div>
  );
};

export default App;
