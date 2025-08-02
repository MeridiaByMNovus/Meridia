import { Terminal, ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { SearchAddon, ISearchOptions } from "@xterm/addon-search";
import PerfectScrollbar from "perfect-scrollbar";
import { themeService } from "../service/ThemeServiceSingleton.js";
import { KnownColorKey } from "../../../typings/types.js";

const FONT_STACK =
  'Monaco, Menlo, Consolas, "Droid Sans Mono", "Inconsolata", "Courier New", monospace';

export type TerminalSize = { cols: number; rows: number };

const SearchSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
const ChevronUpSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
const ChevronDownSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const CloseSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

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

  constructor(
    container: HTMLDivElement,
    ptyId: number,
    size: TerminalSize = { cols: 80, rows: 30 }
  ) {
    this.ptyId = ptyId;
    const terminalWrapper = document.createElement("div");
    terminalWrapper.className = "terminal-root";
    container.appendChild(terminalWrapper);

    const theme: ITheme = {
      background: themeService.getVar("terminal.background"),
      foreground: themeService.getVar("foreground"),
      cursor: themeService.getVar("cursor.foreground"),
    };

    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();

    this.terminal = new Terminal({
      theme,
      fontFamily: FONT_STACK,
      fontSize: 16,
      lineHeight: 1.25,
      letterSpacing: 0,
      cols: size.cols,
      rows: size.rows,
      scrollback: 10000,
      allowProposedApi: true,
    });

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.searchAddon);
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
        wheelSpeed: 1,
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
      setTimeout(() => {
        this.fitAddon.fit();
      }, 0);
      this.sendResize();
      window.electron.ipcRenderer.send("ptyInstance.spawn", ptyId);
      window.addEventListener("resize", () => this.fitIfNeeded());
    });

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

    const ro = new ResizeObserver(() => this.fitIfNeeded());
    ro.observe(container);
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

  forceFit() {
    this.fitIfNeeded();
  }

  private sendResize() {
    window.electron.ipcRenderer.send("ptyInstance.resize", {
      id: this.ptyId,
      cols: this.terminal.cols,
      rows: this.terminal.rows,
    });
  }

  resize(cols: number, rows: number) {
    this.terminal.resize(cols, rows);
    this.sendResize();
    this.scrollbar?.update();
  }

  dispose() {
    this.scrollbar?.destroy();
    window.electron.ipcRenderer.send("ptyInstance.kill", this.ptyId);
    this.terminal.dispose();
  }

  private bindTheme(cssVar: KnownColorKey, key: keyof ITheme) {
    themeService.watchVar(cssVar, (val) => {
      const theme = this.terminal.options.theme ?? {};
      this.terminal.options.theme = { ...theme, [key]: val };
    });
  }

  private createSearchUI(parent: HTMLDivElement) {
    const bar = document.createElement("div");
    bar.className = "terminal-search-bar";

    const icon = document.createElement("span");
    icon.className = "terminal-search-icon";
    icon.innerHTML = SearchSVG;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "terminal-search-input";
    input.placeholder = "Find";

    const btnPrev = document.createElement("button");
    btnPrev.className = "terminal-search-btn";
    btnPrev.innerHTML = ChevronUpSVG;
    btnPrev.onclick = () => this.findPrev();

    const btnNext = document.createElement("button");
    btnNext.className = "terminal-search-btn";
    btnNext.innerHTML = ChevronDownSVG;
    btnNext.onclick = () => this.findNext();

    const btnClose = document.createElement("button");
    btnClose.className = "terminal-search-btn close";
    btnClose.innerHTML = CloseSVG;
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

  runCommand(command: string) {
    window.electron.ipcRenderer.send("ptyInstance.keystroke", {
      id: this.ptyId,
      data: command + "\r",
    });
  }
}
