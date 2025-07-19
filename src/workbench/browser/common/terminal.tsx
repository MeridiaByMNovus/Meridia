import { useLayoutEffect, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import "@xterm/xterm/css/xterm.css";

let terminalIdCounter = 0;

type TerminalTab = {
  id: number;
  name: string;
  xterm: XTerminal;
  fit: FitAddon;
};

export let [activeTabId, setActiveTabId]: any = [];

export function Terminal() {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  [activeTabId, setActiveTabId] = useState<number | null>(null);

  const createTerminal = () => {
    const term = new XTerminal({
      cursorBlink: true,
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 15,
      lineHeight: 1.4,
      theme: {
        background: getComputedStyle(document.documentElement).getPropertyValue(
          "--terminal-bg"
        ),
        foreground: getComputedStyle(document.documentElement).getPropertyValue(
          "--text-color"
        ),
        cursor: getComputedStyle(document.documentElement).getPropertyValue(
          "--text-color"
        ),
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);

    const id = terminalIdCounter++;
    const tabName = `Local ${id + 1}`;
    const tab: TerminalTab = { id, name: tabName, xterm: term, fit };

    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);

    setTimeout(() => {
      const el = document.getElementById(`terminal-${id}`);
      if (el) {
        term.open(el);
        fit.fit();
        window.electron.ipcRenderer.send("terminal.spawn", id);
      }
    }, 0);

    term.onData((data) => {
      try {
        window.electron.ipcRenderer.send("terminal.keystroke", { id, data });
      } catch {}
    });

    window.electron.ipcRenderer.on(
      `terminal.incomingData.${id}`,
      (_: any, data: any) => {
        term.write(data);
      }
    );
  };

  const removeTerminal = (id: number) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      window.electron.ipcRenderer.removeAllListeners(
        `terminal.incomingData.${id}`
      );

      tab.xterm.dispose();

      window.electron.ipcRenderer.send("terminal.kill", id);
    }

    setTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveTabId((prev: any) => (prev === id ? (tabs[0]?.id ?? null) : prev));
  };

  useLayoutEffect(() => {
    setTimeout(() => {
      if (tabs.length === 0) {
        createTerminal();
      }
    }, 3000);
  }, []);

  return (
    <div
      className="terminal-wrapper"
      style={{
        background: "var(--terminal-bg)",
      }}
    >
      <div className="tabs">
        <div className="title">Terminal</div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <div className="name">{tab.name}</div>
            <CloseOutlined
              onClick={(e) => {
                e.stopPropagation();
                removeTerminal(tab.id);
              }}
            />
          </div>
        ))}
        <div className="tab add-tab" onClick={createTerminal}>
          <PlusOutlined />
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`terminal-${tab.id}`}
          style={{
            display: tab.id === activeTabId ? "block" : "none",
            width: "100%",
            height: "100%",
            paddingTop: "8px",
            paddingLeft: "8px",
          }}
        />
      ))}
    </div>
  );
}
