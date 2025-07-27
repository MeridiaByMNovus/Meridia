import { Terminal, ITheme } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import { FitAddon } from "@xterm/addon-fit";
import { themeService } from "../ThemeServiceSingleton.js";

export type TerminalSize = { cols: number; rows: number };

export class SpawnTerminal {
  terminal: Terminal;
  private ptyId: number;
  private scrollbar?: PerfectScrollbar;
  private fitAddon: FitAddon;

  constructor(
    container: HTMLDivElement,
    ptyId: number,
    size: TerminalSize = { cols: 80, rows: 30 }
  ) {
    this.ptyId = ptyId;
    const terminalWrapper = document.createElement("div");
    container.appendChild(terminalWrapper);

    const theme: ITheme = {
      background: themeService.getVar("--terminal-bg"),
      foreground: themeService.getVar("--text-color"),
      cursor: themeService.getVar("--cursor-color"),
    };

    this.fitAddon = new FitAddon();

    this.terminal = new Terminal({
      theme,
      fontSize: 16,
      cols: size.cols,
      rows: size.rows,
      scrollback: 10000,
    });

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(terminalWrapper);

    const viewport = terminalWrapper.querySelector(
      ".xterm-viewport"
    ) as HTMLElement | null;
    if (viewport) {
      this.scrollbar = new PerfectScrollbar(viewport, {
        wheelSpeed: 1,
        suppressScrollX: true,
      });
    }

    this.bindTheme("--terminal-bg", "background");
    this.bindTheme("--text-color", "foreground");
    this.bindTheme("--cursor-color", "cursor");

    window.electron.ipcRenderer.send("ptyInstance.spawn", ptyId);

    this.terminal.onData((data) => {
      window.electron.ipcRenderer.send("ptyInstance.keystroke", {
        id: ptyId,
        data,
      });
    });

    window.electron.ipcRenderer.on(
      `ptyInstance.incomingData.${ptyId}`,
      (_e: unknown, data: string) => {
        this.terminal.write(data);
        this.scrollbar?.update();
      }
    );

    window.electron.ipcRenderer.send("ptyInstance.resize", {
      id: ptyId,
      cols: this.terminal.cols,
      rows: this.terminal.rows,
    });
  }

  fitToContainer() {
    const dims = this.fitAddon.proposeDimensions();
    if (!dims) return;
    this.resize(dims.cols, dims.rows);
  }

  fitIfNeeded() {
    const dims = this.fitAddon.proposeDimensions();
    if (!dims) return;
    if (dims.cols !== this.terminal.cols || dims.rows !== this.terminal.rows) {
      this.resize(dims.cols, dims.rows);
    }
  }

  resize(cols: number, rows: number) {
    this.terminal.resize(cols, rows);
    window.electron.ipcRenderer.send("ptyInstance.resize", {
      id: this.ptyId,
      cols,
      rows,
    });
    this.scrollbar?.update();
  }

  dispose() {
    this.scrollbar?.destroy();
    window.electron.ipcRenderer.send("ptyInstance.kill", this.ptyId);
    this.terminal.dispose();
  }

  private bindTheme(cssVar: string, key: keyof ITheme) {
    themeService.watchVar(cssVar, (val) => {
      const theme = this.terminal.options.theme ?? {};
      this.terminal.options.theme = { ...theme, [key]: val };
    });
  }
}
