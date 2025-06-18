import React, { useEffect, useRef, useState } from "react";
import { RouterProvider } from "react-router-dom";

import { ConfigProvider, theme } from "antd/es";
import { PrimeReactProvider } from "primereact/api";
import { FluentProvider, webDarkTheme } from "@fluentui/react-components";

import { useAppDispatch, useAppSelector } from "../helpers/hooks";
import router from "../helpers/router";

import { IEditorSettings, IFolderStructure } from "../helpers/types";

import {
  set_folder_structure,
  update_settings,
} from "../helpers/state-manager";

import { AnantProvider } from "../../support/ui-kit";
import { Command } from "cmdk";
import { commands } from "./commands";
import { RegisterPluginWorker } from "../../main/workers/plugin_worker";

const App = React.memo((props: any) => {
  const dispatch = useAppDispatch();
  const settingsDe = useAppSelector((state) => state.main.editorSettings);
  const stateDe = useAppSelector((state) => state.main.uiState);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommandSelect = (commandId: string) => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send("execute-command", commandId);
    } else {
      console.error("IPC Renderer is not available.");
    }
  };

  window.electron.ipcRenderer.on(
    "new-folder-opened",
    async (event: any, data: any) => {
      const folder = (await window.electron.get_folder()) as IFolderStructure;
      if (folder) dispatch(set_folder_structure(folder));
      // dispatch(update_active_file(null));
      // dispatch(update_active_files(null));
      window.electron.ipcRenderer.send("terminal.change-folder", data);
      window.electron.ipcRenderer.send("chokidar-change-folder", data);
    }
  );

  window.electron.ipcRenderer.on(
    "folder-updated",
    async (event: any, data: any) => {
      const folder = (await window.electron.get_folder()) as IFolderStructure;
      if (folder) dispatch(set_folder_structure(folder));
    }
  );

  const startup = React.useCallback(async () => {
    // const ui = (await window.electron.get_ui()) as IUI;
    const folder = (await window.electron.get_folder()) as IFolderStructure;
    const settings = (await window.electron.get_settings()) as IEditorSettings;
    // const state = (await window.electron.get_ui_state()) as IUIState;

    if (!localStorage.getItem("mnovus_meridia")) {
      window.electron.set_settings(settingsDe);
      window.electron.set_ui_state(stateDe);
      localStorage.setItem("mnovus_meridia", "false");
    }

    if (folder) dispatch(set_folder_structure(folder));
    if (settings) dispatch(update_settings(settings));
    // if (state) dispatch(update_ui_state(state));
    // if (ui) dispatch(update_ui(ui));
    // if (state) {
    //   if (state.active_file) {
    //   }
    // }

    RegisterPluginWorker();
  }, [dispatch]);

  React.useLayoutEffect(() => {
    startup();
  }, [startup]);

  useEffect(() => {
    window.electron.ipcRenderer.on("open-command-palette", () => {
      setOpen(true);
    });

    return () =>
      window.electron.ipcRenderer.removeListener(
        "open-command-palette",
        setOpen
      );
  }, []);

  return (
    <FluentProvider theme={webDarkTheme}>
      <AnantProvider mode="dark">
        <PrimeReactProvider>
          <ConfigProvider
            theme={{
              algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
              components: {
                Splitter: {
                  splitBarSize: 0,
                },
              },
            }}
          >
            {open && (
              <div className="overlay" onClick={() => setOpen(false)}>
                <div
                  className="command-palette"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Command>
                    <Command.Input
                      value={search}
                      onValueChange={setSearch}
                      placeholder="Type a command..."
                      className="command-input"
                      autoFocus
                    />
                    <Command.List>
                      {commands
                        .filter((cmd) =>
                          cmd.label.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((cmd) => (
                          <Command.Item
                            key={cmd.id}
                            onSelect={() => {
                              handleCommandSelect(cmd.id);
                              setOpen(false);
                            }}
                            className="command-item"
                          >
                            <span>{cmd.label}</span>
                            <div className="shortcut-container">
                              {cmd.shortcut.map((key, index) => (
                                <React.Fragment key={index}>
                                  <span className="shortcut-box">{key}</span>
                                  {index < cmd.shortcut.length - 1 && (
                                    <span className="plus">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </Command.Item>
                        ))}
                    </Command.List>
                  </Command>
                </div>
              </div>
            )}
            <RouterProvider router={router} />
          </ConfigProvider>
        </PrimeReactProvider>
      </AnantProvider>
    </FluentProvider>
  );
});

export default App;
