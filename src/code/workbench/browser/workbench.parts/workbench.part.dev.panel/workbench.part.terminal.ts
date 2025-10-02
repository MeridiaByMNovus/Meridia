import { IDevPanelTab } from "../../../workbench.types.js";
import {
  addIcon,
  closeIcon,
  terminalIcon,
} from "../../workbench.media/workbench.icons.js";
import { CoreEl } from "../workbench.part.el.js";
import { _xtermManager } from "../../../common/workbench.dev.panel/workbench.dev.panel.spawn.xterm.js";
import PerfectScrollbar from "perfect-scrollbar";

export class Terminal extends CoreEl {
  private _tabs: IDevPanelTab[] = [];
  private _nextId = 1;

  constructor() {
    super();
    this._createEl();
    this._initializeSampleTabs();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "terminal-container";

    const tabs = document.createElement("div");
    tabs.className = "tabs scrollbar-container y-disable";

    const extra = document.createElement("div");
    extra.className = "extra";

    const terminalArea = document.createElement("div");
    terminalArea.className = "terminal-area";

    this._el.appendChild(tabs);
    this._el.appendChild(terminalArea);
  }

  private _initializeSampleTabs() {
    this._tabs = [];
    this._nextId = 1;

    const sampleTabs: IDevPanelTab[] = [
      {
        id: `terminal-${this._nextId++}`,
        name: "bash - main",
        active: true,
        cwd: "/home/user/projects/meridia",
      },
      {
        id: `terminal-${this._nextId++}`,
        name: "npm dev",
        active: false,
        cwd: "/home/user/projects/meridia",
      },
    ];

    this._tabs = sampleTabs;
    this._render();
  }

  private _render() {
    const tabsContainer = this._el?.querySelector(".tabs");
    if (!tabsContainer) return;

    const extra = document.createElement("div");
    extra.className = "extra";

    tabsContainer.innerHTML = "";

    this._tabs.forEach((tab) => {
      const tabEl = document.createElement("div");
      tabEl.className = `tab ${tab.active ? "active" : ""}`;

      tabEl.onclick = (e) => {
        if ((e.target as HTMLElement).closest(".close-icon")) return;

        this._switch(tab.id);
      };

      const icon = document.createElement("span");
      icon.className = "icon";
      icon.innerHTML = terminalIcon;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = tab.name;

      const closeButton = document.createElement("span");
      closeButton.className = "close-icon";
      closeButton.innerHTML = closeIcon;
      closeButton.onclick = (e) => {
        e.stopPropagation();
        this._close(tab.id);
      };

      tabEl.appendChild(icon);
      tabEl.appendChild(name);
      tabEl.appendChild(closeButton);

      tabsContainer.appendChild(tabEl);
    });

    const add = document.createElement("span");
    add.innerHTML = addIcon;

    add.onclick = () => {
      const newTab = this._add();
      this._switch(newTab.id);
    };

    extra.appendChild(add);

    const activeTab = this._tabs.find((t) => t.active);
    if (activeTab) {
      this._open(activeTab);
    }

    tabsContainer.appendChild(extra);
  }

  private async _open(tab: IDevPanelTab) {
    const terminalArea = this._el?.querySelector(".terminal-area");
    if (!terminalArea) return;

    terminalArea.innerHTML = "";

    const container =
      _xtermManager._get(tab.id) || (await _xtermManager._spawn(tab.id));

    terminalArea.appendChild(container!);

    const termInstance = _xtermManager._terminals.get(tab.id);
    const term = termInstance?.term;
    if (term) {
      term.focus();
    }

    if (termInstance) {
      console.log(termInstance._container);
      const scrollAreaElem = termInstance._container.querySelector(
        ".xterm-viewport"
      ) as HTMLElement;
      const _scrollbar = new PerfectScrollbar(scrollAreaElem, {
        suppressScrollX: true,
      });

      let updateTimeout: NodeJS.Timeout;
      const debouncedUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          _scrollbar.update();
        }, 16);
      };

      const mutationObserver = new MutationObserver((mutations) => {
        const hasRelevantChanges = mutations.some(
          (mutation) =>
            mutation.type === "childList" ||
            (mutation.type === "attributes" &&
              mutation.attributeName === "style" &&
              ((mutation.target as HTMLElement).style.height !== undefined ||
                (mutation.target as HTMLElement).style.width !== undefined))
        );

        if (hasRelevantChanges) {
          debouncedUpdate();
        }
      });

      mutationObserver.observe(scrollAreaElem, {
        childList: false,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
        attributeOldValue: false,
      });
    }
  }

  private _close(tabId: string) {
    const tabIndex = this._tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    const closingTab = this._tabs[tabIndex]!;
    const isClosingActive = closingTab.active;

    this._tabs = this._tabs.filter((t) => t.id !== tabId);
    _xtermManager._dispose(tabId);

    if (isClosingActive && this._tabs.length > 0) {
      const newActiveIndex =
        tabIndex < this._tabs.length ? tabIndex : this._tabs.length - 1;
      this._tabs = this._tabs.map((tab, index) => ({
        ...tab,
        active: index === newActiveIndex,
      }));
    }

    this._render();
  }

  public _add(options?: Partial<IDevPanelTab>) {
    const newTab: IDevPanelTab = {
      id: `terminal-${this._nextId++}`,
      name: options?.name || `Terminal ${this._nextId - 1}`,
      active: true,
      cwd: options?.cwd || "/",
    };

    this._tabs = this._tabs.map((t) => ({ ...t, active: false }));
    this._tabs.push(newTab);

    this._render();
    return newTab;
  }

  public _getActive() {
    return this._tabs.find((t) => t.active);
  }

  public _switch(tabId: string) {
    this._tabs = this._tabs.map((t) => ({
      ...t,
      active: t.id === tabId,
    }));
    this._render();
  }
}
