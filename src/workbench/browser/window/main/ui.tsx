import { useContext, useEffect } from "react";

import { Splitter } from "antd";

import { useAppDispatch, useAppSelector } from "../../../react-hooks/hooks";

import { MainContext } from "../../../react-hooks/functions";
import { update_project_options } from "../../../react-hooks/state_manager";
import { RegisterShortcuts } from "../../../scripts/shortcuts/register_shortcuts";
import { togglePanel } from "../../../services/use_panel_buttons";
import { useTabs } from "../../../services/use_tab";

import { registerAllShortcuts } from "../../../scripts/shortcuts/keyboard";
import { registerAllEvents } from "../../../scripts/electron/ipc";
import { setOpen } from "../../react/app";

import { TitlebarUI } from "./layout/titlebar";
import { Footer } from "./layout/footer";
import { LeftSidebar } from "./layout/sidebar/left";
import { RightSidebar } from "./layout/sidebar/right";
import { Content } from "./layout/content";
import { TabView } from "./components/tab_view";

import { Explorer } from "../../common/explorer";
import { Console } from "../../common/console";
import { Terminal } from "../../common/terminal";
import { Extension } from "../../common/extension";

import { titlebar } from "../../../scripts/others/titlebar";

export default function NewUi() {
  const topTabs = useTabs("explorer");
  const bottomTabs = useTabs("terminal");

  const dispatch = useAppDispatch();
  const panel_state = useAppSelector((state) => state.main.panel_state);
  const active_file = useAppSelector((state) => state.main.active_file);
  const project_options = useAppSelector((state) => state.main.project_options);
  const { layout } = useAppSelector((state) => state.main.layout);
  const useMainContextIn = useContext(MainContext);

  const { left_panel, right_panel, bottom_panel } = useAppSelector(
    (state) => state.main.panel_state
  );

  useEffect(() => {
    titlebar({ target_window: "main" });
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.on(
      "update-project-options",
      (
        _: any,
        payload: {
          data: {
            python_path: string;
            python_version: string;
            python_version_tag: string;
          };
        }
      ) => {
        const { python_path, python_version, python_version_tag } =
          payload.data;

        dispatch(
          update_project_options({
            python_path: python_path,
            python_version: python_version,
            python_version_tag: python_version_tag,
          })
        );
      }
    );
  }, []);

  useEffect(() => {
    const removeShortcuts = registerAllShortcuts(setOpen);
    registerAllEvents(dispatch, setOpen);
    RegisterShortcuts({
      dispatch: dispatch,
      layout: panel_state,
      active_file: active_file,
      togglePanel: togglePanel,
      useMainContextIn: useMainContextIn,
      project_options: project_options,
    });

    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    return () => {
      removeShortcuts();
    };
  }, [dispatch, panel_state]);

  function render_layout() {
    switch (layout) {
      case "layout_1":
        return (
          <Splitter layout="vertical" style={{ height: "100%" }}>
            <Splitter.Panel>
              <Splitter layout="horizontal" style={{ height: "100%" }}>
                <Splitter.Panel
                  defaultSize="20%"
                  size={left_panel ? undefined : "0%"}
                  min="10%"
                  max="60%"
                  style={{
                    background: "var(--sidebar-content-bg)",
                    borderRight: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ height: "100%" }}>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="explorer"
                      fullHeight
                    >
                      <Explorer />
                    </TabView>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="extension"
                      fullHeight
                    >
                      <Extension />
                    </TabView>
                  </div>
                </Splitter.Panel>

                <Splitter.Panel>
                  <Splitter layout="horizontal" style={{ height: "100%" }}>
                    <Splitter.Panel
                      defaultSize="70%"
                      min="10%"
                      style={{
                        background: "var(--editor-bg)",
                      }}
                    >
                      <Content />
                    </Splitter.Panel>
                  </Splitter>
                </Splitter.Panel>

                <Splitter.Panel
                  defaultSize="20%"
                  size={right_panel ? undefined : "0%"}
                  min="10%"
                  max="60%"
                  style={{
                    background: "var(--sidebar-content-bg)",
                    borderLeft: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ height: "100%" }}>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="explorer"
                      fullHeight
                    >
                      <Explorer />
                    </TabView>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="extension"
                      fullHeight
                    >
                      <Extension />
                    </TabView>
                  </div>
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>

            <Splitter.Panel
              defaultSize="35%"
              min="10%"
              max="60%"
              size={bottom_panel ? undefined : "0%"}
            >
              <div className="scroll-wrapper" style={{ height: "100%" }}>
                <TabView
                  activeTab={bottomTabs.activeTab}
                  tab="terminal"
                  fullHeight
                >
                  <Terminal />
                </TabView>
                <TabView
                  activeTab={bottomTabs.activeTab}
                  tab="console"
                  fullHeight
                >
                  <Console />
                </TabView>
              </div>
            </Splitter.Panel>
          </Splitter>
        );

      case "layout_2":
        return (
          <Splitter layout="vertical" style={{ height: "100%" }}>
            <Splitter.Panel>
              <Splitter layout="horizontal" style={{ height: "100%" }}>
                <Splitter.Panel
                  defaultSize="20%"
                  size={left_panel ? undefined : "0%"}
                  min="10%"
                  max="60%"
                  style={{
                    background: "var(--sidebar-content-bg)",
                    borderRight: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="explorer"
                      fullHeight
                    >
                      <Explorer />
                    </TabView>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="extension"
                      fullHeight
                    >
                      <Extension />
                    </TabView>
                  </div>
                </Splitter.Panel>

                <Splitter.Panel>
                  <Splitter layout="vertical" style={{ height: "100%" }}>
                    <Splitter.Panel
                      defaultSize="70%"
                      min="10%"
                      style={{
                        background: "var(--editor-bg)",
                      }}
                    >
                      <Content />
                    </Splitter.Panel>

                    <Splitter.Panel
                      defaultSize="35%"
                      min="10%"
                      max="60%"
                      size={bottom_panel ? undefined : "0%"}
                    >
                      <div
                        className="scroll-wrapper"
                        style={{ height: "100%" }}
                      >
                        <TabView
                          activeTab={bottomTabs.activeTab}
                          tab="terminal"
                          fullHeight
                        >
                          <Terminal />
                        </TabView>
                        <TabView
                          activeTab={bottomTabs.activeTab}
                          tab="console"
                          fullHeight
                        >
                          <Console />
                        </TabView>
                      </div>
                    </Splitter.Panel>
                  </Splitter>
                </Splitter.Panel>

                <Splitter.Panel
                  defaultSize="20%"
                  size={right_panel ? undefined : "0%"}
                  min="10%"
                  max="60%"
                  style={{
                    background: "var(--sidebar-content-bg)",
                    borderLeft: "1px solid var(--border-color)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="explorer"
                      fullHeight
                    >
                      <Explorer />
                    </TabView>
                    <TabView
                      activeTab={topTabs.activeTab}
                      tab="extension"
                      fullHeight
                    >
                      <Extension />
                    </TabView>
                  </div>
                </Splitter.Panel>
              </Splitter>
            </Splitter.Panel>
          </Splitter>
        );
    }
  }

  return (
    <div className="main-wrapper">
      <TitlebarUI />

      <div className="layout-row">
        <LeftSidebar
          activeTopTab={topTabs.activeTab}
          setActiveTopTab={topTabs.setActiveTab}
          activeBottomTab={bottomTabs.activeTab}
          setActiveBottomTab={bottomTabs.setActiveTab}
        />

        {render_layout()}
        <RightSidebar />
      </div>
      <Footer />
    </div>
  );
}
