import { useAppSelector } from "../../../../react-hooks/hooks";
import { get_file_types } from "../../../../react-hooks/functions";

import Tooltip from "../components/tooltip";
import { ActionSelector } from "../components/action_selector";
import { use, useEffect, useState } from "react";

export function Footer() {
  const folder_structure = useAppSelector(
    (state) => state.main.folder_structure
  );
  const editor_indent = useAppSelector((state) => state.main.indent);
  const active_file = useAppSelector((state) => state.main.active_file);
  const active_files = useAppSelector((state) => state.main.active_files);
  const { python_path, python_version } = useAppSelector(
    (state) => state.main.project_options
  );

  const [active_action, set_active_action] = useState<
    "python" | "spacing" | "encoding" | null
  >(null);
  const [python_versions, set_python_versions] = useState<
    { version_tag: string; cmd: string; version: string }[]
  >([]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("get-python-versions", "")
      .then((versions) => {
        set_python_versions(versions);
      });
  }, []);

  const actions = [
    {
      label: "Reopen with Encoding",
      action: () => console.log("Reopened with Encoding"),
    },
    {
      label: "Save with Encoding",
      action: () => console.log("Saved with Encoding"),
    },
    {
      label: "Convert to UTF-8",
      action: () => console.log("Converted to UTF-8"),
    },
    {
      label: "Detect Encoding Automatically",
      action: () => console.log("Detected Encoding Automatically"),
    },
    {
      label: "Show All Encodings",
      action: () => console.log("Showing all encodings"),
    },
  ];

  const python_actions = python_versions.map((e) => ({
    label: `${e.version} (${e.cmd})`,
    action: () => console.log(`Python ${e.version} ${e.cmd}`),
  }));

  function handle_set_action(type: "python" | "spacing" | "encoding") {
    set_active_action((prev) => (prev === type ? null : type));
  }

  return (
    <div className="footer-wrapper">
      {active_action && (
        <ActionSelector
          actions={active_action === "python" ? python_actions : actions}
          on_outside_click={() => set_active_action(null)}
        />
      )}

      <span>
        {active_file?.name ||
          folder_structure?.name?.split(/\/|\\/).at(-1) ||
          "main"}
      </span>

      {active_files.length !== 0 && (
        <div style={{ display: "flex", gap: "2px" }}>
          <span>
            Ln {editor_indent.line}, Col {editor_indent.column}
          </span>
          {python_version && (
            <span onClick={() => handle_set_action("python")}>
              <Tooltip text={python_path} position="top">
                {python_version}
              </Tooltip>
            </span>
          )}
          <span onClick={() => handle_set_action("spacing")}>Spaces: 4</span>
          <span onClick={() => handle_set_action("encoding")}>UTF-8</span>
          <span style={{ textTransform: "capitalize" }}>
            {get_file_types(active_file?.name) ?? "Text"}
          </span>
        </div>
      )}
    </div>
  );
}
