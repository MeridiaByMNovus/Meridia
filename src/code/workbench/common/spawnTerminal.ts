import { Terminal, ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { SearchAddon, ISearchOptions } from "@xterm/addon-search";
import PerfectScrollbar from "perfect-scrollbar";
import { themeService } from "./classInstances/themeInstance.js";
import { KnownColorKey } from "../../../typings/types.js";
import { SettingsController } from "../browser/common/controller/SettingsController.js";
import {
  chevronDownIcon,
  chevronUpIcon,
  closeIcon,
  searchIcon,
} from "./svgIcons.js";

const FONT_STACK =
  'Monaco, Menlo, Consolas, "Droid Sans Mono", "Inconsolata", "Courier New", monospace';

export type TerminalSize = { cols: number; rows: number };

export class SpawnTerminal {
  terminal: Terminal;
  private ptyId: number;
  private scrollbar?: PerfectScrollbar;
  private fitAddon: FitAddon;
  private searchAddon: SearchAddon;
  private searchBar!: HTMLDivElement;
  private searchInput!: HTMLInputElement;
  private host!: HTMLElement;
  private btnPrev!: HTMLButtonElement;
  private btnNext!: HTMLButtonElement;
  private btnClose!: HTMLButtonElement;
  private searchOpts: ISearchOptions = {
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  };
  private resizeObserver?: ResizeObserver;
  private isDisposed = false;
  private commandExecuting = false;
  private settingsWatchers: (() => void)[] = [];

  constructor(
    container: HTMLDivElement,
    ptyId: number,
    size: TerminalSize = { cols: 80, rows: 30 }
  ) {
    this.ptyId = ptyId;
    const terminalWrapper = document.createElement("div");
    terminalWrapper.className = "terminal-root";
    container.appendChild(terminalWrapper);

    const settingsController = SettingsController.getInstance();

    const theme: ITheme = {
      background: themeService.getVar("terminal.background"),
      foreground: themeService.getVar("foreground"),
      cursor: themeService.getVar("cursor.foreground"),
    };

    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();

    this.terminal = new Terminal({
      theme,
      fontFamily:
        settingsController.get("terminal.integrated.fontFamily") || FONT_STACK,
      fontSize: settingsController.get("terminal.integrated.fontSize") || 14,
      lineHeight:
        settingsController.get("terminal.integrated.lineHeight") || 1.25,
      letterSpacing:
        settingsController.get("terminal.integrated.letterSpacing") || 0,
      cols: size.cols,
      rows: size.rows,
      scrollback:
        settingsController.get("terminal.integrated.scrollback") || 10000,
      allowProposedApi: true,
      cursorBlink: settingsController.get("terminal.cursorBlink") ?? true,
      cursorStyle: settingsController.get("terminal.cursorStyle") || "block",
      cursorWidth: settingsController.get("terminal.cursorWidth") || 1,
      smoothScrollDuration: settingsController.get(
        "terminal.integrated.smoothScrolling"
      )
        ? 120
        : 0,
      fastScrollSensitivity:
        settingsController.get("terminal.integrated.fastScrollSensitivity") ||
        5,
      scrollSensitivity:
        settingsController.get(
          "terminal.integrated.mouseWheelScrollSensitivity"
        ) || 1,

      macOptionIsMeta:
        settingsController.get("terminal.integrated.macOptionIsMeta") ?? false,
      rightClickSelectsWord:
        settingsController.get("terminal.integrated.rightClickBehavior") ===
        "selectWord",

      drawBoldTextInBrightColors:
        settingsController.get(
          "terminal.integrated.drawBoldTextInBrightColors"
        ) ?? true,
      allowTransparency:
        settingsController.get("terminal.integrated.allowTransparency") ??
        false,
      minimumContrastRatio:
        settingsController.get("terminal.integrated.minimumContrastRatio") || 1,
      tabStopWidth:
        settingsController.get("terminal.integrated.tabStopWidth") || 8,
    });

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.searchAddon);

    // Setup all settings watchers
    this.setupSettingsWatchers();

    try {
      const webgl = new WebglAddon();
      this.terminal.loadAddon(webgl);
    } catch {}

    this.terminal.open(terminalWrapper);

    const viewport = terminalWrapper.querySelector(
      ".xterm-viewport"
    ) as HTMLElement | null;
    if (viewport) {
      this.scrollbar = new PerfectScrollbar(viewport, {
        wheelSpeed:
          settingsController.get(
            "terminal.integrated.mouseWheelScrollSensitivity"
          ) || 1,
        suppressScrollX: true,
      });
    }

    this.bindTheme("terminal.background", "background");
    this.bindTheme("foreground", "foreground");
    this.bindTheme("cursor.foreground", "cursor");

    this.createSearchUI(terminalWrapper);
    this.host = terminalWrapper;
    this.bindSearchKeys(this.host);

    this.initAfterFonts().then(() => {
      if (this.isDisposed) return;

      requestAnimationFrame(() => {
        if (!this.isDisposed) {
          this.fitAddon.fit();
        }
      });
      this.sendResize();

      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDisposed && !this.commandExecuting) {
          this.fitIfNeeded();
        }
      });
      this.resizeObserver.observe(container);
    });

    this.terminal.onData((data) => {
      if (!this.isDisposed) {
        window.ipc.send("ptyInstance.keystroke", {
          id: this.ptyId,
          data,
        });
      }
    });

    window.ipc.on(
      `ptyInstance.incomingData.${this.ptyId}`,
      (_e: unknown, data: string) => {
        if (!this.isDisposed) {
          this.terminal.write(data);
          this.scrollbar?.update();

          if (this.commandExecuting) {
            this.commandExecuting = false;

            setTimeout(() => {
              if (!this.isDisposed) {
                this.fitIfNeeded();
              }
            }, 50);
          }
        }
      }
    );

    this.addWindowResizeListener();
    this.setupSettingsWatchers();
  }

  private setupSettingsWatchers() {
    const settingsController = SettingsController.getInstance();

    // Font settings
    const watcherFontSize = settingsController.onChange(
      "terminal.integrated.fontSize",
      (size: number) => {
        this.terminal.options.fontSize = size;
        this.fitToContainer();
      }
    );

    const watcherFontFamily = settingsController.onChange(
      "terminal.integrated.fontFamily",
      (family: string) => {
        this.terminal.options.fontFamily = family;
        this.fitToContainer();
      }
    );

    const watcherLineHeight = settingsController.onChange(
      "terminal.integrated.lineHeight",
      (lineHeight: number) => {
        this.terminal.options.lineHeight = lineHeight;
        this.fitToContainer();
      }
    );

    const watcherLetterSpacing = settingsController.onChange(
      "terminal.integrated.letterSpacing",
      (letterSpacing: number) => {
        this.terminal.options.letterSpacing = letterSpacing;
        this.fitToContainer();
      }
    );

    // Cursor settings
    const watcherCursorBlink = settingsController.onChange(
      "terminal.cursorBlink",
      (blink: boolean) => {
        this.terminal.options.cursorBlink = blink;
      }
    );

    const watcherCursorStyle = settingsController.onChange(
      "terminal.cursorStyle",
      (style: string) => {
        this.terminal.options.cursorStyle = style as any;
      }
    );

    const watcherCursorWidth = settingsController.onChange(
      "terminal.cursorWidth",
      (width: number) => {
        this.terminal.options.cursorWidth = width;
      }
    );

    // Scrolling settings
    const watcherScrollback = settingsController.onChange(
      "terminal.integrated.scrollback",
      (scrollback: number) => {
        this.terminal.options.scrollback = scrollback;
      }
    );

    const watcherSmoothScrolling = settingsController.onChange(
      "terminal.integrated.smoothScrolling",
      (smooth: boolean) => {
        this.terminal.options.smoothScrollDuration = smooth ? 120 : 0;
      }
    );

    const watcherFastScrollSensitivity = settingsController.onChange(
      "terminal.integrated.fastScrollSensitivity",
      (sensitivity: number) => {
        this.terminal.options.fastScrollSensitivity = sensitivity;
      }
    );

    const watcherMouseWheelScrollSensitivity = settingsController.onChange(
      "terminal.integrated.mouseWheelScrollSensitivity",
      (sensitivity: number) => {
        this.terminal.options.scrollSensitivity = sensitivity;
        if (this.scrollbar) {
          this.scrollbar.settings.wheelSpeed = sensitivity;
          this.scrollbar.update();
        }
      }
    );

    const watcherMacOptionIsMeta = settingsController.onChange(
      "terminal.integrated.macOptionIsMeta",
      (isMeta: boolean) => {
        this.terminal.options.macOptionIsMeta = isMeta;
      }
    );

    const watcherRightClickBehavior = settingsController.onChange(
      "terminal.integrated.rightClickBehavior",
      (behavior: string) => {
        this.terminal.options.rightClickSelectsWord = behavior === "selectWord";
      }
    );

    // Display settings
    const watcherDrawBoldTextInBrightColors = settingsController.onChange(
      "terminal.integrated.drawBoldTextInBrightColors",
      (draw: boolean) => {
        this.terminal.options.drawBoldTextInBrightColors = draw;
      }
    );

    const watcherAllowTransparency = settingsController.onChange(
      "terminal.integrated.allowTransparency",
      (allow: boolean) => {
        this.terminal.options.allowTransparency = allow;
      }
    );

    const watcherMinimumContrastRatio = settingsController.onChange(
      "terminal.integrated.minimumContrastRatio",
      (ratio: number) => {
        this.terminal.options.minimumContrastRatio = ratio;
      }
    );

    const watcherTabStopWidth = settingsController.onChange(
      "terminal.integrated.tabStopWidth",
      (width: number) => {
        this.terminal.options.tabStopWidth = width;
      }
    );

    // Store all watchers for cleanup
    this.settingsWatchers.push(
      watcherFontSize,
      watcherFontFamily,
      watcherLineHeight,
      watcherLetterSpacing,
      watcherCursorBlink,
      watcherCursorStyle,
      watcherCursorWidth,
      watcherScrollback,
      watcherSmoothScrolling,
      watcherFastScrollSensitivity,
      watcherMouseWheelScrollSensitivity,
      watcherMacOptionIsMeta,
      watcherRightClickBehavior,
      watcherDrawBoldTextInBrightColors,
      watcherAllowTransparency,
      watcherMinimumContrastRatio,
      watcherTabStopWidth
    );
  }

  private addWindowResizeListener() {
    let resizeTimeout: NodeJS.Timeout;
    const handleWindowResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!this.isDisposed && !this.commandExecuting) {
          this.fitIfNeeded();
        }
      }, 100);
    };

    window.addEventListener("resize", handleWindowResize);

    (this as any).cleanupWindowResize = () => {
      window.removeEventListener("resize", handleWindowResize);
      clearTimeout(resizeTimeout);
    };
  }

  attachTo(container: HTMLElement) {
    if (!this.isDisposed) {
      this.terminal.open(container);
    }
  }

  private async initAfterFonts() {
    if ("fonts" in document) {
      try {
        await (document as any).fonts.ready;
      } catch {}
    }
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
  }

  fitToContainer() {
    if (this.isDisposed || this.commandExecuting) return;

    const dims = this.fitAddon.proposeDimensions();
    if (!dims) return;

    const cols = Math.floor(dims.cols);
    const rows = Math.floor(dims.rows);

    if (cols > 0 && rows > 0) this.resize(cols, rows);
  }

  fitIfNeeded() {
    if (this.isDisposed || this.commandExecuting) return;

    const dims = this.fitAddon.proposeDimensions();
    if (!dims) return;

    const cols = dims.cols;
    const rows = dims.rows;

    if (cols < 10 || rows < 5) {
      return;
    }

    if (
      Number.isInteger(cols) &&
      Number.isInteger(rows) &&
      (cols !== this.terminal.cols || rows !== this.terminal.rows)
    ) {
      this.resize(cols, rows);
    }
  }

  forceFit() {
    if (!this.isDisposed && !this.commandExecuting) {
      this.fitIfNeeded();
    }
  }

  private sendResize() {
    if (!this.isDisposed) {
      window.ipc.send("ptyInstance.resize", {
        id: this.ptyId,
        cols: this.terminal.cols,
        rows: this.terminal.rows,
      });
    }
  }

  resize(cols: number, rows: number) {
    if (!this.isDisposed && cols > 0 && rows > 0) {
      this.terminal.resize(cols, rows);
      this.sendResize();
      this.scrollbar?.update();
    }
  }

  dispose() {
    this.isDisposed = true;

    if ((this as any).cleanupWindowResize) {
      (this as any).cleanupWindowResize();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    window.ipc.removeAllListeners(`ptyInstance.incomingData.${this.ptyId}`);

    this.scrollbar?.destroy();

    window.ipc.send("ptyInstance.kill", this.ptyId);

    this.terminal.dispose();
  }

  private bindTheme(cssVar: KnownColorKey, key: keyof ITheme) {
    themeService.watchVar(cssVar, (val) => {
      if (!this.isDisposed) {
        const theme = this.terminal.options.theme ?? {};
        this.terminal.options.theme = { ...theme, [key]: val };
      }
    });
  }

  private createSearchUI(parent: HTMLDivElement) {
    const bar = document.createElement("div");
    bar.className = "terminal-search-bar";

    const icon = document.createElement("span");
    icon.className = "terminal-search-icon";
    icon.innerHTML = searchIcon;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "terminal-search-input";
    input.placeholder = "Find";

    const btnPrev = document.createElement("button");
    btnPrev.className = "terminal-search-btn";
    btnPrev.innerHTML = chevronUpIcon;
    btnPrev.onclick = () => this.findPrev();

    const btnNext = document.createElement("button");
    btnNext.className = "terminal-search-btn";
    btnNext.innerHTML = chevronDownIcon;
    btnNext.onclick = () => this.findNext();

    const btnClose = document.createElement("button");
    btnClose.className = "terminal-search-btn close";
    btnClose.innerHTML = closeIcon;
    btnClose.onclick = () => this.closeSearch();

    bar.append(icon, input, btnPrev, btnNext, btnClose);
    parent.appendChild(bar);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) this.findNext();
      else if (e.key === "Enter" && e.shiftKey) this.findPrev();
    });

    this.searchBar = bar;
    this.searchInput = input;
    this.btnPrev = btnPrev;
    this.btnNext = btnNext;
    this.btnClose = btnClose;
  }

  private openSearch() {
    this.searchBar.classList.add("active");
    this.searchInput.focus();
    this.searchInput.select();
  }

  private closeSearch() {
    this.searchBar.classList.remove("active");
    this.terminal.focus();
  }

  private findNext() {
    const v = this.searchInput.value;
    if (!v) return;
    this.searchAddon.findNext(v, this.searchOpts);
  }

  private findPrev() {
    const v = this.searchInput.value;
    if (!v) return;
    this.searchAddon.findPrevious(v, this.searchOpts);
  }

  private bindSearchKeys(root: HTMLElement) {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

    this.terminal.attachCustomKeyEventHandler((e) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault?.();
        this.openSearch();
        return false;
      }
      if (e.key === "Escape") {
        this.closeSearch();
        return false;
      }
      return true;
    });

    root.addEventListener(
      "keydown",
      (e) => {
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "f") {
          e.preventDefault();
          this.openSearch();
        } else if (e.key === "Escape") {
          this.closeSearch();
        }
      },
      true
    );
  }

  clearAndAttachTo(container: HTMLElement) {
    if (!this.isDisposed) {
      container.innerHTML = "";
      this.attachTo(container);
      this.fitToContainer();
    }
  }

  executeCommand(command: string) {
    if (!this.isDisposed) {
      this.commandExecuting = true;

      window.ipc.send("ptyInstance.keystroke", {
        id: this.ptyId,
        data: command + "\r",
      });
    }
  }

  moveTo(container: HTMLElement) {
    if (!this.host || !container || this.isDisposed) return;

    container.innerHTML = "";
    this.attachTo(container);
    this.fitToContainer();
  }

  getPtyId(): number {
    return this.ptyId;
  }

  getIsDisposed(): boolean {
    return this.isDisposed;
  }
}
