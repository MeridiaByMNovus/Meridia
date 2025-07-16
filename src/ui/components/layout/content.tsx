import {
  JSX,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop } from "react-dnd";

import { getIconForFile } from "vscode-icons-js/dist/Index";
import {
  AppstoreOutlined,
  CloseOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons/lib";

import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import {
  update_active_file,
  update_active_files,
  update_simple_tab,
  update_simple_tabs,
} from "../../../helpers/state_manager";
import { TActiveFile, TSimpleTab } from "../../../helpers/types";
import { MainContext } from "../../../helpers/functions";
import { ContextMenu } from "../../components/context_menu";
import { Extension } from "../../workspace/extension";
import { ExtensionPage } from "../../workspace/extension/extension_page";
import { Settings } from "../../workspace/settings";
import { ImageViewer } from "../../workspace/editors/image_viewer";

const ItemType = {
  TAB: "TAB",
};

function SimpleTab({ tab, index, moveTab, isActive }: any) {
  const active_files = useAppSelector((state) => state.main.active_files);
  const simple_tabs = useAppSelector((state) => state.main.simple_tabs);
  const simple_tab = useAppSelector((state) => state.main.simple_tab);

  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const useMainContextIn = useContext(MainContext);

  const handle_set_tab = useCallback((tab: TSimpleTab) => {
    useMainContextIn.handle_set_tab(tab);
  }, []);

  const handleRemoveTab = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const updatedTabs = simple_tabs.filter((t: any) => t.id !== tab.id);
      const index_to_remove = simple_tabs.findIndex(
        (t: any) => t.id === tab.id
      );

      dispatch(update_simple_tabs(updatedTabs));

      if (simple_tab?.id === tab.id) {
        const next_index =
          index_to_remove < updatedTabs.length
            ? index_to_remove
            : index_to_remove - 1;

        if (updatedTabs.length > 0) {
          dispatch(update_simple_tab(updatedTabs[next_index]));
        } else if (active_files.length > 0) {
          dispatch(update_active_file(active_files[0]));
          dispatch(update_simple_tab(null));
        } else {
          dispatch(update_simple_tab(null));
        }
      }
    },
    [simple_tabs, simple_tab, active_files]
  );

  const [, drop] = useDrop({
    accept: ItemType.TAB,
    hover(item: { index: number }) {
      if (!ref.current || item.index === index) return;
      moveTab(item.index, index);
      item.index = index;
    },
  });

  const [, drag] = useDrag({
    type: ItemType.TAB,
    item: { index },
  });

  const iconMap: Record<string, JSX.Element> = {
    extension: <AppstoreOutlined />,
    settings: <SettingOutlined />,
  };

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`tab ${isActive ? "active" : ""}`}
      onClick={() => handle_set_tab(tab)}
    >
      <div className="file-icon">
        {iconMap[tab.icon?.toLowerCase() ?? ""] || <FileTextOutlined />}
      </div>
      <div className="file-name">{tab.name}</div>
      <div className="icons">
        <button className="close-icon" onClick={handleRemoveTab}>
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
}

function DraggableTab({ file, index, moveTab, isActive, state }: any) {
  const active_files = useAppSelector((state) => state.main.active_files);
  const active_file = useAppSelector((state) => state.main.active_file);
  const simple_tabs = useAppSelector((state) => state.main.simple_tabs);

  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);

  const useMainContextIn = useContext(MainContext);

  const handle_set_selected_file = useCallback(
    (active_file: TActiveFile) => {
      dispatch(update_simple_tab(null));
      dispatch(update_active_file(active_file));
      useMainContextIn.handle_set_editor(active_file);
    },
    [dispatch, useMainContextIn]
  );

  const handleRemoveFile = useCallback(
    (e: any, file: TActiveFile) => {
      e.stopPropagation();

      const _clone = [...active_files];
      const index_to_remove = _clone.findIndex((_t) => _t.path === file.path);
      const targetFile = _clone[index_to_remove];
      _clone.splice(index_to_remove, 1);

      if (active_file.path === file.path) {
        const next_index =
          index_to_remove < _clone.length
            ? index_to_remove
            : index_to_remove - 1;

        if (_clone.length > 0) {
          dispatch(update_active_file(_clone[next_index]));
        } else if (simple_tabs.length > 0) {
          dispatch(update_simple_tab(simple_tabs[0]));
          dispatch(update_active_file(null));
        } else {
          dispatch(update_active_file(null));
        }
      }

      dispatch(update_active_files(_clone));
      useMainContextIn.handle_remove_editor(targetFile);
    },
    [active_files, active_file, simple_tabs]
  );

  const [, drop] = useDrop({
    accept: ItemType.TAB,
    hover(item: { index: number }, monitor) {
      if (!ref.current || item.index === index) return;

      moveTab(item.index, index);
      item.index = index;
    },
  });

  const [, drag] = useDrag({
    type: ItemType.TAB,
    item: { index },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`tab ${isActive ? "active" : ""}`}
      onClick={() => {
        handle_set_selected_file(file);
      }}
    >
      <div className="file-icon">
        <img src={`icons/${getIconForFile(file.name)}`} alt={file.name} />
      </div>
      <div className={`file-name ${state}`}>{file.name}</div>
      <div className="icons">
        <span className={`icons ${file.is_touched ? "is_touched" : ""}`}>
          <button
            onClick={(e) => handleRemoveFile(e, file)}
            className="close-icon"
          >
            <CloseOutlined />
          </button>
          <span className="dot" />
        </span>
      </div>
    </div>
  );
}

export function Content() {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const active_files = useAppSelector((state) => state.main.active_files);
  const active_file = useAppSelector((state) => state.main.active_file);
  const simple_tabs = useAppSelector((state) => state.main.simple_tabs);
  const simple_tab = useAppSelector((state) => state.main.simple_tab);
  const dispatch = useAppDispatch();

  const componentMap: Record<string, (props: any) => ReactElement> = {
    Extension: () => <Extension />,
    ExtensionPage: (props) => <ExtensionPage {...props} />,
    Settings: () => <Settings />,
    imageViewer: (props) => <ImageViewer {...props} />,
  };

  const moveTab = (from: number, to: number) => {
    const updated = [...active_files];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    dispatch(update_active_files(updated));
  };

  return (
    <div
      className="content-wrapper"
      style={{
        height: "100%",
      }}
    >
      {isDropdownOpen && (
        <ContextMenu
          contextMenuPos={contextMenuPos}
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <button>1</button>
          <hr />
          <button>2</button>
        </ContextMenu>
      )}
      {active_files.length || simple_tabs.length > 0 ? (
        <div className="page-tabs">
          {active_files.map((file: TActiveFile, index: number) => (
            <DraggableTab
              key={file.path ?? index}
              file={file}
              index={index}
              moveTab={moveTab}
              state={file.diagnostic_state}
              isActive={active_file?.path === file?.path}
            />
          ))}
          {simple_tabs.map((tab: TSimpleTab, index: number) => (
            <SimpleTab
              key={tab.id}
              tab={tab}
              index={index}
              moveTab={moveTab}
              isActive={simple_tab?.name === tab.name}
            />
          ))}
        </div>
      ) : (
        <div
          className="no-file-selected"
          style={{
            height: "100%",
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
            setIsDropdownOpen(true);
          }}
        >
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
      )}

      <div className="scroll-area">
        {(active_files.length > 0 || simple_tabs.length > 0) && (
          <div
            style={{
              height: "100%",
            }}
          >
            <div
              className="editor-container"
              style={{
                height: "100%",
                display: `${active_file ? "block" : "none"}`,
              }}
            ></div>

            <div
              className="simple-tab"
              style={{
                height: "100%",
                display: `${simple_tab ? "block" : "none"}`,
              }}
            >
              {simple_tab?.component && componentMap[simple_tab.component] ? (
                componentMap[simple_tab.component](simple_tab.props)
              ) : (
                <div>Unknown Component</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
