import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../helpers/hooks";
import { get_file_types } from "../../../helpers/functions";
import { ReactComponent as BellIcon } from "../../../assets/svg/bell-dot.svg";

import "./index.css";
import {
  CloseCircleOutlined,
  CloseOutlined,
  InfoCircleFilled,
} from "@ant-design/icons/lib";

const FooterComponent = React.memo(() => {
  const folder_structure = useAppSelector(
    (state) => state.main.folder_structure
  );
  const editor_indent = useAppSelector((state) => state.main.indent);
  const active_file = useAppSelector((state) => state.main.active_file);
  const active_files = useAppSelector((state) => state.main.active_files);

  const footerRef = useRef(null);

  return (
    <div
      className="footer-section"
      style={{
        borderTop: "1px solid var(--main-border-color)",
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 8px",
        alignItems: "center",
      }}
      ref={footerRef}
    >
      <div>
        <span>
          {active_file?.name ||
            folder_structure?.name?.split(/\/|\\/).at(-1) ||
            "main"}
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {active_files.length !== 0 && (
          <div>
            Ln {editor_indent.line}, Col {editor_indent.column} (
            {editor_indent.selected} selected)
          </div>
        )}

        {active_files.length !== 0 && <div>Spaces: 4</div>}

        {active_files.length !== 0 && <div>UTF-8</div>}

        {active_file?.name && (
          <div style={{ textTransform: "capitalize" }}>
            {get_file_types(active_file.name)}
          </div>
        )}
      </div>
    </div>
  );
});

export default FooterComponent;
