import { FitAddon } from "xterm-addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import { IXTermInstance } from "../../workbench.types.js";
import { getStandalone } from "../workbench.standalone.js";
import { Theme } from "../workbench.theme.js";

const ipcRenderer = window.ipc;

class XtermManager {
  _terminals = new Map<string, IXTermInstance>();
  private _runningCommands = new Map<
    string,
    { pid?: number; isRunning: boolean }
  >();
  private _completionDetected = new Map<string, boolean>();

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
      // Filter out execution completion markers and everything after
      let filteredData = this._filterExecutionMarkers(id, data);

      if (
        filteredData.includes("\x1b[H\x1b[2J") ||
        filteredData.includes("\x1b[2J")
      ) {
        term.clear();
      } else if (filteredData.length > 0) {
        // Only write if there's actual data left after filtering
        term.write(filteredData);
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
        selectionBackground: _theme.getColor(
          "workbench.terminal.selection.background"
        ),
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

  // Filter out execution completion markers and everything after them
  private _filterExecutionMarkers(id: string, data: string): string {
    // Check if completion was already detected for this terminal
    if (this._completionDetected.get(id)) {
      return ""; // Block all further output after completion
    }

    // Check if this data chunk contains a completion marker
    const executionMarkerRegex =
      /__EXECUTION_COMPLETE_[a-f0-9]{8}__[A-Z_]+(_\d+)?/;
    const hasMarker =
      executionMarkerRegex.test(data) ||
      data.includes("__EXECUTION_COMPLETE_") ||
      data.includes("__SUCCESS") ||
      data.includes("__ERROR") ||
      data.includes("__INTERRUPTED") ||
      data.includes("__EXCEPTION");

    if (hasMarker) {
      // Mark completion as detected for this terminal
      this._completionDetected.set(id, true);

      // Split by lines and find where the marker appears
      const lines = data.split("\n");
      const filteredLines = [];

      for (const line of lines) {
        // Stop processing once we hit a completion marker line
        if (
          line.match(executionMarkerRegex) ||
          line.includes("__EXECUTION_COMPLETE_") ||
          line.includes("__SUCCESS") ||
          line.includes("__ERROR") ||
          line.includes("__INTERRUPTED") ||
          line.includes("__EXCEPTION")
        ) {
          break; // Stop here - don't include this line or any after it
        }
        filteredLines.push(line);
      }

      return filteredLines.join("\n");
    }

    // No marker found, return original data
    return data;
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
    this._completionDetected.delete(id);

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
      } catch (e) {}
    }
  }

  async _run(id: string, command: string): Promise<boolean> {
    try {
      // Reset completion detection for new command
      this._completionDetected.set(id, false);
      this._runningCommands.set(id, { isRunning: true });

      const instance = this._terminals.get(id);
      if (!instance?.term) {
        this._runningCommands.delete(id);
        return false;
      }

      instance.term.clear();

      instance.term.options.disableStdin = false;

      const commandCompleted = this._wait(id);
      const result = await ipcRenderer.invoke("pty-run-command", id, command);

      if (!result.success) {
        this._runningCommands.delete(id);
        this._completionDetected.delete(id);
        instance.term.write(`\r\nError: ${result.error}\r\n`);
        instance.term.options.disableStdin = true;
        return false;
      }

      const wasSuccessful = await commandCompleted;

      instance.term.options.disableStdin = true;
      this._runningCommands.delete(id);

      return wasSuccessful;
    } catch (error) {
      this._runningCommands.delete(id);
      this._completionDetected.delete(id);

      const instance = this._terminals.get(id);
      if (instance?.term) {
        instance.term.write(`\r\nError: ${error}\r\n`);
        instance.term.options.disableStdin = true;
      }

      return false;
    }
  }

  private _wait(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const instance = this._terminals.get(id);
      if (!instance?.term) {
        resolve(false);
        return;
      }

      let dataBuffer = "";
      let timeoutId: NodeJS.Timeout;
      let resolved = false;

      // Listen to raw PTY data (before filtering) for completion detection
      const ptyDataListener = (event: any, data: string) => {
        if (resolved) return;

        dataBuffer += data;

        const hasCompletionMarker = dataBuffer.includes(
          "__EXECUTION_COMPLETE_"
        );

        if (hasCompletionMarker) {
          const lines = dataBuffer.split("\n");
          const completionLine = lines.find((line) =>
            line.includes("__EXECUTION_COMPLETE_")
          );

          if (completionLine) {
            cleanup();
            const wasSuccessful = completionLine.includes("SUCCESS");
            resolved = true;
            resolve(wasSuccessful);
            return;
          }
        }

        if (
          dataBuffer.includes("__SUCCESS") ||
          dataBuffer.includes("SUCCESS")
        ) {
          cleanup();
          resolved = true;
          resolve(true);
          return;
        }

        if (
          dataBuffer.includes("__ERROR") ||
          dataBuffer.includes("__INTERRUPTED") ||
          dataBuffer.includes("__EXCEPTION")
        ) {
          cleanup();
          resolved = true;
          resolve(false);
          return;
        }
      };

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        ipcRenderer.removeListener(`pty-data-${id}`, ptyDataListener);
      };

      ipcRenderer.on(`pty-data-${id}`, ptyDataListener);

      timeoutId = setTimeout(() => {
        if (!resolved) {
          cleanup();
          resolved = true;
          resolve(false);
        }
      }, 60000);
    });
  }

  async _stop(id: string): Promise<boolean> {
    const commandInfo = this._runningCommands.get(id);
    if (!commandInfo || !commandInfo.isRunning) {
      return false;
    }

    const term = this._terminals.get(id)?.term;

    if (term) {
      try {
        this._runningCommands.set(id, { ...commandInfo, isRunning: false });
        this._completionDetected.delete(id);

        term.options.disableStdin = true;

        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  _isRunning(id: string): boolean {
    const commandInfo = this._runningCommands.get(id);
    return commandInfo?.isRunning || false;
  }

  _getRunningCommands(): string[] {
    const running: string[] = [];
    for (const [id, info] of this._runningCommands.entries()) {
      if (info.isRunning) {
        running.push(id);
      }
    }
    return running;
  }

  _clearRunningStatus(id: string): void {
    this._runningCommands.delete(id);
    this._completionDetected.delete(id);
  }

  _setRunningStatus(id: string, isRunning: boolean, pid?: number): void {
    const current = this._runningCommands.get(id) || { isRunning: false };
    this._runningCommands.set(id, {
      ...current,
      isRunning,
      pid: pid || current.pid!,
    });
  }
}

export const _xtermManager = new XtermManager();
