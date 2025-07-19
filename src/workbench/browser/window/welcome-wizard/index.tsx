import { useEffect, useState } from "react";
import { ConfigProvider, Splitter, theme } from "antd/es";

import { useTabs } from "../../../services/use_tab";

import { TProjectData } from "../../../react-hooks/types";

import { TitlebarUI } from "./layout/titlebar";
import { Footer } from "./layout/footer";
import { NewProjectFooter } from "./layout/footer/new-project-footer-options";

import { Sidebar } from "./components/sidebar";
import { Projects } from "./components/sidebar/contents/projects";
import { Plugins } from "./components/sidebar/contents/plugins";
import { NewProject } from "./components/sidebar/contents/new-project";
import { TabView } from "../main/components/tab_view";

import { Settings } from "../../common/settings";

import { titlebar } from "../../../scripts/others/titlebar";

export function WelcomeWizard() {
  const [data, set_data] = useState<TProjectData>();
  const active_tabs = useTabs("projects");

  function handleCreate() {
    if (data !== null) {
      window.electron.create_project(data);
    }
  }

  useEffect(() => {
    titlebar({ target_window: "welcomeWizard" });
  }, []);
  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
        components: { Splitter: { splitBarSize: 0 } },
      }}
    >
      <div className="welcome-wizard-wrapper">
        <TitlebarUI />
        <Splitter style={{ height: "100%" }}>
          <Splitter.Panel
            defaultSize="20%"
            min="20%"
            max="70%"
            style={{
              background: "var(--sidebar-bg)",
              borderRight: "1px solid var(--border-color)",
            }}
          >
            <Sidebar
              activeTab={active_tabs.activeTab}
              setActiveTab={active_tabs.setActiveTab}
            />
          </Splitter.Panel>
          <Splitter.Panel>
            <div style={{ height: "100%" }}>
              <TabView
                activeTab={active_tabs.activeTab}
                tab="projects"
                fullHeight
              >
                <Projects setActiveTab={active_tabs.setActiveTab} />
              </TabView>
              <TabView
                activeTab={active_tabs.activeTab}
                tab="plugins"
                fullHeight
              >
                <Plugins />
              </TabView>
              <TabView
                activeTab={active_tabs.activeTab}
                tab="settings"
                fullHeight
              >
                <Settings />
              </TabView>
              <TabView
                activeTab={active_tabs.activeTab}
                tab="new-project"
                fullHeight
              >
                <NewProject set_data={set_data} />
              </TabView>
            </div>
          </Splitter.Panel>
        </Splitter>
        {active_tabs.activeTab.toString() === "new-project" && (
          <Footer>
            <NewProjectFooter
              setActiveTab={active_tabs.setActiveTab}
              onCreate={handleCreate}
            />
          </Footer>
        )}
      </div>
    </ConfigProvider>
  );
}
