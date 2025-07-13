import {
  AppstoreOutlined,
  CodeOutlined,
  FolderOutlined,
  PythonOutlined,
} from "@ant-design/icons";
import Tooltip from "../../tooltip";

interface LeftSidebarProps {
  activeTopTab: string;
  setActiveTopTab: any;
  activeBottomTab: string;
  setActiveBottomTab: any;
}

export function LeftSidebar({
  activeTopTab,
  setActiveTopTab,
  activeBottomTab,
  setActiveBottomTab,
}: LeftSidebarProps) {
  return (
    <div className="left-sidebar">
      <div className="top">
        <Tooltip text="Explorer">
          <button
            id="explorer"
            className={activeTopTab === "explorer" ? "active" : ""}
            onClick={() => setActiveTopTab("explorer")}
          >
            <FolderOutlined />
          </button>
        </Tooltip>
        <Tooltip text="Extension">
          <button
            id="extension"
            className={activeTopTab === "extension" ? "active" : ""}
            onClick={() => setActiveTopTab("extension")}
          >
            <AppstoreOutlined />
          </button>
        </Tooltip>
      </div>
      <div className="bottom">
        <Tooltip text="Terminal">
          <button
            id="terminal"
            className={activeBottomTab === "terminal" ? "active" : ""}
            onClick={() => setActiveBottomTab("terminal")}
          >
            <CodeOutlined />
          </button>
        </Tooltip>
        <Tooltip text="Console">
          <button
            id="console"
            className={activeBottomTab === "console" ? "active" : ""}
            onClick={() => setActiveBottomTab("console")}
          >
            <PythonOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
