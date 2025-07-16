import { useContext, useEffect } from "react";

import { Splitter } from "antd";

import { useAppDispatch, useAppSelector } from "../helpers/hooks";

import { MainContext } from "../helpers/functions";
import { RegisterShortcuts } from "./scripts/shortcuts/register_shortcuts";
import { togglePanel } from "../hooks/use_panel_buttons";
import { useTabs } from "../hooks/use_tab";

import { registerAllShortcuts } from "./scripts/shortcuts/keyboard";
import { registerAllEvents } from "./scripts/electron/ipc";
import { setOpen } from "../app";

import { TitlebarUI } from "./components/layout/titlebar";
import { Footer } from "./components/layout/footer";
import { LeftSidebar } from "./components/layout/sidebar/left";
import { RightSidebar } from "./components/layout/sidebar/right";
import { Content } from "./components/layout/content";
import { TabView } from "./components/tab_view";

import { Explorer } from "./workspace/explorer";
import { Console } from "./workspace/console";
import { Terminal } from "./workspace/terminal";
import { Extension } from "./workspace/extension";

import { titlebar } from "./scripts/others/titlebar";

export default function NewUi() {
  const topTabs = useTabs("explorer");
  const bottomTabs = useTabs("terminal");

  const dispatch = useAppDispatch();
  const layout = useAppSelector((state) => state.main.layout);
  const active_file = useAppSelector((state) => state.main.active_file);
  const useMainContextIn = useContext(MainContext);

  const { left_panel, right_panel, bottom_panel } = useAppSelector(
    (state) => state.main.layout
  );

  useEffect(() => {
    titlebar({ main: true });
  }, []);

  useEffect(() => {
    const removeShortcuts = registerAllShortcuts(setOpen);
    registerAllEvents(dispatch, setOpen);
    RegisterShortcuts({
      dispatch: dispatch,
      layout: layout,
      active_file: active_file,
      togglePanel: togglePanel,
      useMainContextIn: useMainContextIn,
    });

    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    return () => {
      removeShortcuts();
    };
  }, [dispatch, layout]);

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
        {/* <RightSidebar /> */}
      </div>
      <Footer />
    </div>
  );
}
