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
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span style={{ textTransform: "capitalize" }}>
            {get_file_types(active_file?.name) ?? "Text"}
          </span>
        </div>
      )}
    </div>
  );
}
