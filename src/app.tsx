import React, { useState } from "react";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider, theme } from "antd/es";
import { PrimeReactProvider } from "primereact/api";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useAppSetup } from "./ui/scripts/startup/startup";
import { registerAllShortcuts } from "./ui/scripts/shortcuts/keyboard";

import { useAppDispatch } from "./helpers/hooks";

import router from "./helpers/router";
import { CommandOverlay } from "./ui/components/command_overlay";

export let [open, setOpen]: any = [];

const App: React.FC = React.memo(() => {
  [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useAppSetup();

  registerAllShortcuts(setOpen);

  return (
    <PrimeReactProvider>
      <ConfigProvider
        theme={{
          algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
          components: { Splitter: { splitBarSize: 0 } },
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
                  handleCommandSelect={(id: any) =>
                    window.electron?.ipcRenderer?.send("execute-command", id)
                  }
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
