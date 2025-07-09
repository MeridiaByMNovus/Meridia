import { useEffect, useState } from "react";
import {
  AppstoreOutlined,
  CodeOutlined,
  FolderOutlined,
  PythonOutlined,
} from "@ant-design/icons";
import Tooltip from "../tooltip";

export function LeftSidebar() {
  return (
    <div className="left-sidebar">
      <div className="top">
        <Tooltip text="Explorer">
          <button id="explorer" className="sidebar-set-button">
            <FolderOutlined />
          </button>
        </Tooltip>
        <Tooltip text="Extension">
          <button id="extension" className="sidebar-set-button">
            <AppstoreOutlined />
          </button>
        </Tooltip>
      </div>
      <div className="bottom">
        <Tooltip text="Terminal">
          <button id="terminal" className="sidebar-set-button">
            <CodeOutlined />
          </button>
        </Tooltip>
        <Tooltip text="Console">
          <button id="console" className="sidebar-set-button">
            <PythonOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
