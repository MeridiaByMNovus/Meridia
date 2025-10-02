import { FitAddon } from "xterm-addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import { IXTermInstance } from "../../workbench.types.js";
import { getStandalone } from "../workbench.standalone.js";
import { Theme } from "../workbench.theme.js";

const ipcRenderer = window.ipc;

class XtermManager {
  _terminals = new Map<string, IXTermInstance>();

  async _spawn(id: string, options?: any): Promise<HTMLElement> {
    if (this._terminals.has(id)) {
      return this._terminals.get(id)!._container;
    }

    const _container = document.createElement("div");
    _container.style.position = "relative";
    _container.style.width = "100%";
    _container.style.height = "100%";
    _container.style.background = "var(--workbench-terminal-background)";
    _container.style.display = "flex";
    _container.style.flexDirection = "column";
    _container.style.padding = "12px";

    const term = new XTerm({
      ...options,
      scrollback: 1000,
      fontFamily: "Jetbrains Mono",
      fontSize: 18,
    });
    term.open(_container);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    fitAddon.fit();

    await ipcRenderer.invoke("pty-spawn", id, term.cols, term.rows);

    const onPtyData = (_event: any, data: string) => {
      if (data.includes("\x1b[H\x1b[2J") || data.includes("\x1b[2J")) {
        term.clear();
      } else {
        term.write(data);
      }
    };
    ipcRenderer.on(`pty-data-${id}`, onPtyData);

    term.onData((data) => {
      ipcRenderer.invoke("pty-write", id, data);
    });

    term.onResize(({ cols, rows }) => {
      ipcRenderer.invoke("pty-resize", id, cols, rows);

      this._update();
    });

    setTimeout(() => {
      const _theme = getStandalone("theme") as Theme;
      term.options.theme = {
        background: _theme.getColor("workbench.terminal.background"),
        foreground: _theme.getColor("workbench.terminal.foreground"),
        cursor: _theme.getColor("workbench.terminal.cursor.foreground"),
      };
      this._update();
      this._update();
    }, 100);

    this._terminals.set(id, {
      term,
      _container,
      _fitAddon: fitAddon,
      _ptyDataListener: onPtyData,
    });

    return _container;
  }

  _get(id: string): HTMLElement | null {
    return this._terminals.get(id)?._container || null;
  }

  _getTerm(id: string) {
    return this._terminals.get(id) || null;
  }

  _dispose(id: string) {
    const _instance = this._terminals.get(id);
    if (!_instance) return;

    ipcRenderer.removeListener(`pty-data-${id}`, _instance._ptyDataListener);
    _instance.term.dispose();
    _instance._container.remove();
    this._terminals.delete(id);

    ipcRenderer.invoke("pty-kill", id);
  }

  _disposeAll() {
    for (const id of Array.from(this._terminals.keys())) {
      this._dispose(id);
    }
  }

  _update() {
    for (const [id, instance] of this._terminals) {
      try {
        instance._fitAddon.fit();
        const _height =
          instance._container.parentElement!.parentElement!.parentElement!
            .clientHeight -
          85 +
          "px";
        const _width =
          instance._container.parentElement!.parentElement!.parentElement!
            .clientWidth -
          10 +
          "px";
        instance._container.style.height = _height;
        instance._container.style.width = _width;
      } catch (e) {
        console.warn(`Failed to fit terminal ${id}`, e);
      }
    }
  }
}

export const _xtermManager = new XtermManager();
