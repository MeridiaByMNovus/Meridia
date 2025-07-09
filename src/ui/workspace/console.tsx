import { useLayoutEffect, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import "@xterm/xterm/css/xterm.css";

let pythonIdCounter = 0;

type PythonTab = {
  id: number;
  xterm: XTerminal;
  fit: FitAddon;
};

export function Console() {
  const [tabs, setTabs] = useState<PythonTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const createPythonTab = () => {
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

    const id = pythonIdCounter++;
    const tab: PythonTab = { id, xterm: term, fit };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);

    setTimeout(() => {
      const el = document.getElementById(`python-terminal-${id}`);
      if (el) {
        term.open(el);
        fit.fit();
        window.electron.ipcRenderer.send("python-console.spawn", id);
      }
    }, 0);

    term.onData((data) => {
      window.electron.ipcRenderer.send("python-console.keystroke", {
        id,
        data,
      });
    });

    window.electron.ipcRenderer.on(
      `python-console.incomingData.${id}`,
      (_e: any, data: any) => {
        term.write(data);
      }
    );
  };

  const removePythonTab = (id: number) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      tab.xterm.dispose();
      window.electron.ipcRenderer.send("python-console.kill", id);
      window.electron.ipcRenderer.removeAllListeners(
        `python-console.incomingData.${id}`
      );
    }
    setTabs((prev) => prev.filter((t) => t.id !== id));
    setActiveTabId((prev) => (prev === id ? (tabs[0]?.id ?? null) : prev));
  };

  useLayoutEffect(() => {
    setTimeout(() => {
      if (tabs.length === 0) {
        createPythonTab();
      }
    }, 3000);
  }, []);

  return (
    <div
      className="terminal-wrapper"
      style={{ background: "var(--terminal-bg)" }}
    >
      <div className="tabs">
        <div className="title">Python Console</div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <div className="name">Python {tab.id + 1}</div>
            <CloseOutlined
              onClick={(e) => {
                e.stopPropagation();
                removePythonTab(tab.id);
              }}
            />
          </div>
        ))}
        <div className="tab add-tab" onClick={createPythonTab}>
          <PlusOutlined />
        </div>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`python-terminal-${tab.id}`}
          style={{
            display: tab.id === activeTabId ? "block" : "none",
            width: "100%",
            height: "100%",
            padding: "12px",
          }}
        />
      ))}
    </div>
  );
}
