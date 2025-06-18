import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";

export const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalInstance = useRef<XTerminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!terminalRef.current || terminalInstance.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 17,
      lineHeight: 1.4,
      theme: {
        background: "#282D33",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5",
      },
    });

    const fit = new FitAddon();
    terminalInstance.current = term;
    fitAddon.current = fit;

    term.loadAddon(fit);
    term.open(terminalRef.current);

    if (
      terminalRef.current.offsetWidth > 0 &&
      terminalRef.current.offsetHeight > 0
    ) {
      requestAnimationFrame(() => {
        try {
          fit.fit();
        } catch (e) {
          console.error("Initial fitAddon.fit() failed:", e);
        }
      });
    }

    const ro = new ResizeObserver(() => {
      if (
        terminalRef.current &&
        terminalRef.current.offsetWidth > 0 &&
        terminalRef.current.offsetHeight > 0 &&
        fitAddon.current
      ) {
        requestAnimationFrame(() => {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.error("ResizeObserver fitAddon.fit() failed:", e);
          }
        });
      }
    });

    ro.observe(terminalRef.current);
    resizeObserver.current = ro;

    window.electron.ipcRenderer.send("terminal.keystroke", "\r");

    const handleResize = () => {
      if (
        terminalRef.current &&
        terminalRef.current.offsetWidth > 0 &&
        terminalRef.current.offsetHeight > 0 &&
        fitAddon.current
      ) {
        try {
          fitAddon.current.fit();
        } catch (e) {
          console.error("Window resize fitAddon.fit() failed:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    term.onResize(({ cols, rows }) => {
      if (Number.isInteger(cols) && Number.isInteger(rows)) {
        window.electron.ipcRenderer.send("terminal.resize", { cols, rows });
      } else {
        console.warn("Invalid terminal resize dimensions:", { cols, rows });
      }
    });

    window.electron.ipcRenderer.on(
      "terminal.incomingData",
      (_event: any, data: any) => {
        term.write(data);
      }
    );

    term.onData((data) => {
      window.electron.ipcRenderer.send("terminal.keystroke", data);
    });

    return () => {
      term.dispose();
      window.removeEventListener("resize", handleResize);
      window.electron.ipcRenderer.removeAllListeners("terminal.incomingData");

      if (resizeObserver.current && terminalRef.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="terminal"
      style={{
        width: "100%",
        height: "100%",
        marginLeft: "12px",
        marginTop: "12px",
      }}
    />
  );
};
