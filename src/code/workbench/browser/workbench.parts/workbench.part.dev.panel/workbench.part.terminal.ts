import { IDevPanelTab } from "../../../workbench.types.js";
import {
  closeIcon,
  terminalIcon,
} from "../../workbench.media/workbench.icons.js";
import { CoreEl } from "../workbench.part.el.js";

export class Terminal extends CoreEl {
  private _tabs: IDevPanelTab[] = [];
  private _nextId = 1;

  constructor() {
    super();
    this._createEl();
    this._addDefaultTerminal();
    this._initializeSampleTabs();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "terminal-container";

    const _tabs = document.createElement("div");
    _tabs.className = "tabs scrollbar-container y-disable";

    const _terminalArea = document.createElement("div");
    _terminalArea.className = "terminal-area";

    this._el.appendChild(_tabs);
    this._el.appendChild(_terminalArea);
  }

  private _addDefaultTerminal() {
    const defaultTab: IDevPanelTab = {
      id: `terminal-${this._nextId++}`,
      name: "Terminal 1",
      active: true,
      cwd: "/",
      shell: "bash",
    };

    this._tabs.push(defaultTab);
  }

  private _closeTab(tabId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const tabIndex = this._tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    const closingTab = this._tabs[tabIndex]!;
    const isClosingActiveTab = closingTab.active;

    this._tabs = this._tabs.filter((t) => t.id !== tabId);

    if (isClosingActiveTab && this._tabs.length > 0) {
      const newActiveIndex =
        tabIndex < this._tabs.length ? tabIndex : this._tabs.length - 1;
      this._tabs = this._tabs.map((tab, index) => ({
        ...tab,
        active: index === newActiveIndex,
      }));
    }

    if (this._tabs.length === 0) {
      this._addDefaultTerminal();
    }

    this._renderTabs();
    this._closeTerminal(tabId);

    const activeTab = this._tabs.find((t) => t.active);
    if (activeTab) {
      this._openTerminal(activeTab);
    }
  }

  private _renderTabs() {
    const tabsContainer = this._el?.querySelector(".tabs");
    if (!tabsContainer) return;

    const activeTab = this._tabs.find((t) => t.active);
    if (activeTab) {
      this._openTerminal(activeTab);
    }

    tabsContainer.innerHTML = "";

    this._tabs.forEach((tab) => {
      const tabEl = document.createElement("div");
      tabEl.className = `tab ${tab.active ? "active" : ""}`;

      tabEl.onclick = (e) => {
        if ((e.target as HTMLElement).closest(".close-icon")) {
          return;
        }

        this._tabs = this._tabs.map((t) => ({
          ...t,
          active: t.id === tab.id,
        }));

        this._renderTabs();
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
        this._closeTab(tab.id, e);
      };

      tabEl.appendChild(icon);
      tabEl.appendChild(name);
      tabEl.appendChild(closeButton);

      tabsContainer.appendChild(tabEl);
    });
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
        shell: "bash",
      },
      {
        id: `terminal-${this._nextId++}`,
        name: "npm dev",
        active: false,
        cwd: "/home/user/projects/meridia",
        shell: "bash",
      },
      {
        id: `terminal-${this._nextId++}`,
        name: "git status",
        active: false,
        cwd: "/home/user/projects/meridia",
        shell: "bash",
      },
      {
        id: `terminal-${this._nextId++}`,
        name: "python server",
        active: false,
        cwd: "/home/user/projects/api",
        shell: "python",
      },
    ];

    this._tabs = sampleTabs;
    this._renderTabs();
  }

  private _openTerminal(tab: IDevPanelTab) {
    console.log(`Opening terminal: ${tab.name} (${tab.id})`);

    const terminalArea = this._el?.querySelector(".terminal-area");
    if (terminalArea) {
      terminalArea.innerHTML = "";

      const terminalContent = document.createElement("div");
      terminalContent.className = "terminal-content";
      terminalContent.textContent = `Terminal content for: ${tab.name}`;
      terminalContent.style.cssText = `
        padding: 10px;
        font-family: monospace;
        height: 100%;
        overflow-y: auto;
      `;

      terminalArea.appendChild(terminalContent);
    }
  }

  private _closeTerminal(tabId: string) {
    console.log(`Closing terminal: ${tabId}`);
  }

  public addTerminal(options?: Partial<IDevPanelTab>) {
    const newTab: IDevPanelTab = {
      id: `terminal-${this._nextId++}`,
      name: options?.name || `Terminal ${this._nextId - 1}`,
      active: true,
      cwd: options?.cwd || "/",
      shell: options?.shell || "bash",
    };

    this._tabs = this._tabs.map((tab) => ({ ...tab, active: false }));
    this._tabs.push(newTab);

    this._renderTabs();
    return newTab;
  }

  public getActiveTab() {
    return this._tabs.find((t) => t.active);
  }

  public getAllTabs() {
    return [...this._tabs];
  }

  public switchToTab(tabId: string) {
    this._tabs = this._tabs.map((t) => ({
      ...t,
      active: t.id === tabId,
    }));
    this._renderTabs();
  }
}
