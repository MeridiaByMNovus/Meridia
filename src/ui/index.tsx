import { useEffect } from "react";

import { Splitter } from "antd";

import { TitlebarUI } from "./components/layout/titlebar";
import { Footer } from "./components/layout/footer";
import { LeftSidebar } from "./components/layout/sidebar/left";
import { RightSidebar } from "./components/layout/sidebar/right";
import { Content } from "./components/layout/content";

import { titlebar } from "./scripts/titlebar";
import { main } from "./scripts/main";

export default function NewUi() {
  useEffect(() => {
    titlebar();
    main();
  }, []);

  return (
    <div className="main-wrapper">
      <TitlebarUI />
      <div className="layout-row">
        <LeftSidebar />
        <Splitter layout="vertical" style={{ height: "100%" }}>
          <Splitter.Panel>
            <Splitter layout="horizontal" style={{ height: "100%" }}>
              <Splitter.Panel
                defaultSize="20%"
                min="10%"
                max="60%"
                style={{
                  background: "var(--sidebar-content-bg)",
                  borderRight: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                  }}
                  className="top-active-tabs"
                ></div>
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

          <Splitter.Panel defaultSize="35%" min="10%" max="60%">
            <div
              style={{
                height: "100%",
              }}
              className="bottom-active-tabs scroll-wrapper"
            ></div>
          </Splitter.Panel>
        </Splitter>
        <RightSidebar />
      </div>
      <Footer />
    </div>
  );
}
