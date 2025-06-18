import React, { Suspense, useEffect } from "react";
import { getIconForFile } from "vscode-icons-js";
import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import {
  update_active_file,
  update_active_files,
} from "../../../helpers/state-manager";
import { TActiveFile } from "../../../helpers/types";
import { ReactComponent as TimesIcon } from "../../../assets/svg/times.svg";
import PerfectScrollbar from "react-perfect-scrollbar";
import { MainContext } from "../../../helpers/functions";
import MeridiaStudio from "../../../meridia-studio";

const SettingsComponent = React.lazy(() => import("../../settings"));

const ContentSection = React.memo((props: any) => {
  const dispatch = useAppDispatch();
  const { folder_structure, active_files, active_file } = useAppSelector(
    (state) => ({
      folder_structure: state.main.folder_structure,
      active_files: state.main.active_files,
      active_file: state.main.active_file,
    })
  );

  const useMainContextIn = React.useContext(MainContext);

  const handle_set_selected_file = React.useCallback(
    (active_file: TActiveFile) => {
      dispatch(update_active_file(active_file));
      useMainContextIn.handle_set_editor(active_file);
    },
    [active_files]
  );

  const handleRemoveFile = React.useCallback(
    (e: MouseEvent, file: TActiveFile) => {
      e.stopPropagation();

      if (file.name === "Settings" || file.name === "Studio") {
        handleRemoveTab(file);
        return;
      }

      const _clone = [...active_files];
      const index_to_remove = _clone.findIndex((_t) => _t.path == file.path);
      const targetFile = _clone[index_to_remove];
      _clone.splice(index_to_remove, 1);
      const next_index =
        index_to_remove == 0 ? index_to_remove : index_to_remove - 1;
      active_file.path == file.path &&
        dispatch(update_active_file(_clone[next_index]));
      dispatch(update_active_files(_clone));
      useMainContextIn.handle_remove_editor(targetFile);
    },
    [active_files, active_file]
  );

  const handleRemoveTab = React.useCallback(
    (fileToRemove: TActiveFile) => {
      const _clone = [...active_files];

      const index_to_remove = _clone.findIndex(
        (file) => file.name === fileToRemove.name
      );

      if (index_to_remove === -1) return;

      _clone.splice(index_to_remove, 1); // Remove the tab

      let next_index = index_to_remove;

      // Ensure next index is within bounds
      if (next_index >= _clone.length) {
        next_index = _clone.length - 1;
      }

      // Only update active file if the one being removed is currently active
      if (active_file?.name === fileToRemove.name) {
        dispatch(update_active_file(_clone[next_index] || null));
      }

      dispatch(update_active_files(_clone));
    },
    [active_files, active_file]
  );

  const handle_set_tab = React.useCallback(
    (file: TActiveFile) => {
      dispatch(update_active_file(file));
    },
    [active_file, dispatch]
  );

  useEffect(() => {
    const editor: HTMLDivElement = document.querySelector("#editor");
    if (!editor) return;

    if (active_file?.name === "Settings" || active_file?.name === "Studio") {
      editor.style.display = "none";
    } else {
      editor.style.display = "block";
    }
  }, [active_file]);

  const handleMiddleClick = (e: any, file: any) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = "default";
      handleRemoveFile(e, file);
    }
  };

  return (
    <div className="content-section">
      {Object.keys(folder_structure)?.length == 0 && <div></div>}
      {Object.keys(folder_structure)?.length > 0 &&
      active_files?.length == 0 ? (
        <div className="no-selected-files">
          <span>
            <p>Show All Commands</p>
            <code>
              <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
            </code>
          </span>
          <span>
            <p>New File</p>
            <code>
              <kbd>Ctrl</kbd> + <kbd>N</kbd>
            </code>
          </span>
          <span>
            <p>Open File</p>
            <code>
              <kbd>Ctrl</kbd> + <kbd>O</kbd>
            </code>
          </span>
          <span>
            <p>Open Meridia Studio</p>
            <code>
              <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>
            </code>
          </span>
          <span>
            <p>Open Settings</p>
            <code>
              <kbd>Ctrl</kbd> + <kbd>,</kbd>
            </code>
          </span>
        </div>
      ) : (
        <div className="content-inner">
          <PerfectScrollbar className="page-tabs-cont" style={{ zIndex: 9 }}>
            <div className="tabs">
              {active_files?.map((file, index) => (
                <div
                  key={file.path}
                  onClick={() =>
                    file.name === "Settings" || file.name === "Studio"
                      ? handle_set_tab(file)
                      : handle_set_selected_file(file)
                  }
                  className={
                    "tab" + (active_file?.path === file.path ? " active" : "")
                  }
                  onMouseUp={(e) => handleMiddleClick(e, file)}
                  draggable
                >
                  <span>
                    <img
                      src={`icons/${getIconForFile(file.name)}`}
                      width="14px"
                      height="14px"
                    />
                  </span>
                  <span>{file.name}</span>
                  <span
                    onClick={(e) => handleRemoveFile(e as any, file)}
                    className={file.is_touched ? "is_touched" : ""}
                  >
                    <TimesIcon />
                    <span className="dot"></span>
                  </span>
                </div>
              ))}
            </div>
          </PerfectScrollbar>
          <div
            className="editor-container"
            id="editor"
            style={{
              display:
                active_file?.name === "Settings" ||
                active_file?.name === "Studio"
                  ? "none"
                  : "block",
            }}
          ></div>

          {active_file?.name?.endsWith(".py") && (
            <div
              className="python-editor-container"
              id="python-editor"
              style={{
                display:
                  active_file?.name !== "Settings" &&
                  active_file?.name !== "Studio" &&
                  !active_file?.name?.endsWith(".py")
                    ? "block"
                    : "none",
              }}
            ></div>
          )}

          {(active_file?.name === "Settings" ||
            active_file?.name === "Studio") && (
            <PerfectScrollbar options={{ wheelPropagation: false }}>
              {active_file?.name === "Settings" && (
                <Suspense fallback="loading...">
                  <SettingsComponent />
                </Suspense>
              )}
              {active_file?.name === "Studio" && (
                <Suspense fallback="loading...">
                  <MeridiaStudio />
                </Suspense>
              )}
            </PerfectScrollbar>
          )}
        </div>
      )}
    </div>
  );
});

export default ContentSection;
