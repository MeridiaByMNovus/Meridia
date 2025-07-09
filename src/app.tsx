import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RouterProvider } from "react-router-dom";

import { ConfigProvider, theme } from "antd/es";
import { PrimeReactProvider } from "primereact/api";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useAppDispatch, useAppSelector } from "./helpers/hooks";
import router from "./helpers/router";

import { IFolderStructure } from "./helpers/types";
import { set_folder_structure } from "./helpers/state_manager";

import { CommandOverlay } from "./ui/components/command_overlay";

const App: React.FC = React.memo(() => {
  const dispatch = useAppDispatch();
  const editorSettings = useAppSelector((state) => state.main.editorSettings);
  const uiState = useAppSelector((state) => state.main.uiState);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleCommandSelect = (commandId: string) => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send("execute-command", commandId);
    } else {
      console.error("IPC Renderer is not available.");
    }
  };

  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.code === "KeyP"
    ) {
      event.preventDefault();
      setOpen((prev) => !prev);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }, []);

  const handleNewFolder = useCallback(
    async (_: any, path: string) => {
      const folder = (await window.electron.get_folder()) as IFolderStructure;
      if (folder) {
        dispatch(set_folder_structure(folder));
        window.electron.ipcRenderer.send("terminal.change-folder", path);
        window.electron.ipcRenderer.send("chokidar-change-folder", path);
      }
    },
    [dispatch]
  );

  const handleFolderUpdate = useCallback(async () => {
    const folder = (await window.electron.get_folder()) as IFolderStructure;
    if (folder) dispatch(set_folder_structure(folder));
  }, [dispatch]);

  const startup = useCallback(async () => {
    const folder = (await window.electron.get_folder()) as IFolderStructure;

    if (!localStorage.getItem("mnovus_meridia")) {
      localStorage.setItem("mnovus_meridia", "false");
    }

    if (folder) dispatch(set_folder_structure(folder));
  }, [dispatch, editorSettings, uiState]);

  useLayoutEffect(() => {
    startup();
  }, [startup]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyboardShortcut);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
      }
    });

    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => e.preventDefault());

    const ipc = window.electron?.ipcRenderer;
    ipc?.on("open-command-palette", () => setOpen(true));
    ipc?.on("new-folder-opened", handleNewFolder);
    ipc?.on("folder-updated", handleFolderUpdate);

    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcut);
      ipc?.removeListener("open-command-palette", () => setOpen(true));
      ipc?.removeListener("new-folder-opened", handleNewFolder);
      ipc?.removeListener("folder-updated", handleFolderUpdate);
    };
  }, [handleKeyboardShortcut, handleNewFolder, handleFolderUpdate]);

  return (
    <PrimeReactProvider>
      <ConfigProvider
        theme={{
          algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
          components: {
            Splitter: { splitBarSize: 1 },
          },
        }}
      >
        <DndProvider backend={HTML5Backend}>
          {open && (
            <div className="overlay" onClick={() => setOpen(false)}>
              <div
                className="command-palette"
                onClick={(e) => e.stopPropagation()}
              >
                <CommandOverlay
                  search={search}
                  setOpen={setOpen}
                  setSearch={setSearch}
                  handleCommandSelect={handleCommandSelect}
                />
              </div>
            </div>
          )}
          <RouterProvider router={router} />
        </DndProvider>
      </ConfigProvider>
    </PrimeReactProvider>
  );
});

export default App;
