import { useAppSelector } from "../../../helpers/hooks";
import { get_file_types } from "../../../helpers/functions";

export function Footer() {
  const folder_structure = useAppSelector(
    (state) => state.main.folder_structure
  );
  const editor_indent = useAppSelector((state) => state.main.indent);
  const active_file = useAppSelector((state) => state.main.active_file);
  const active_files = useAppSelector((state) => state.main.active_files);
  return (
    <div className="footer-wrapper">
      <div>
        <span>
          {active_file?.name ||
            folder_structure?.name?.split(/\/|\\/).at(-1) ||
            "main"}
        </span>
      </div>

      <div style={{ display: "flex", gap: "2px" }}>
        {active_files.length !== 0 && (
          <span>
            Ln {editor_indent.line}, Col {editor_indent.column}
          </span>
        )}

        {active_files.length !== 0 && <span>Spaces: 4</span>}

        {active_files.length !== 0 && <span>UTF-8</span>}

        {active_file?.name && (
          <span style={{ textTransform: "capitalize" }}>
            {get_file_types(active_file.name) ?? "Text"}
          </span>
        )}
      </div>
    </div>
  );
}
