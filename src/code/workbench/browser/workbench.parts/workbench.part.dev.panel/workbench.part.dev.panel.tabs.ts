import PerfectScrollbar from "perfect-scrollbar";
import { IDevPanelTab } from "../../../workbench.types.js";
import {
  collapseIcon,
  consoleIcon,
  eillipsisIcon,
  expandIcon,
  runIcon,
  terminalIcon,
} from "../../workbench.media/workbench.icons.js";
import { CoreEl } from "../workbench.part.el.js";
import { Panel } from "../workbench.part.panel.js";
import { DevPanel } from "./workbench.part.dev.panel.el.js";
import { Terminal } from "./workbench.part.terminal.js";

export class DevPanelTabs extends CoreEl {
  private _tabs: IDevPanelTab[] = [];
  private _contentEl: HTMLElement;
  private _panels: Map<string, Terminal> = new Map();
  private _isCollapsed: boolean = false;

  constructor(contentEl: HTMLElement, private _devPanel: DevPanel) {
    super();
    this._contentEl = contentEl;
    this._createEl();
    this.initializeTabs();
  }

  private _createEl() {
    this._el = new Panel("tabs").getDomElement()!;
    this._el.className = "panel vertical";
    this._el.style.height = "100%";
    this._el.style.width = "fit-content";

    this._renderTabs();
  }

  private _renderTabs() {
    const existingTabsContainer = this._el!.querySelector(".tabs");
    const existingCollapseIcon = this._el!.querySelector(".collapse");
    if (existingTabsContainer) {
      existingTabsContainer.remove();
    }
    if (existingCollapseIcon) {
      existingCollapseIcon.remove();
    }

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs vertical";
    new PerfectScrollbar(tabsContainer);
    if (!tabsContainer) return;

    const activeTab = this._tabs.find((t) => t.active);
    if (activeTab) {
      this._openPanel(activeTab);
    }

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
      icon.innerHTML = tab.icon ?? terminalIcon;

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = tab.name;

      const closeButton = document.createElement("span");
      closeButton.className = "close-icon";
      closeButton.innerHTML = eillipsisIcon;

      tabEl.appendChild(icon);

      if (!this._isCollapsed) {
        tabEl.appendChild(name);
        tabEl.appendChild(closeButton);
      }

      tabsContainer.appendChild(tabEl);
    });

    const _devPanel = this._devPanel;

    const collapse = document.createElement("span");
    collapse.className = "collapse";
    collapse.innerHTML = _devPanel._isCollapsed ? collapseIcon : expandIcon;

    collapse!.onclick = () => {
      _devPanel._toggle();
    };

    this._el!.appendChild(tabsContainer);
    this._el!.appendChild(collapse);
  }

  public initializeTabs() {
    this._tabs = [];

    const sampleTabs: IDevPanelTab[] = [
      {
        id: `terminal`,
        name: "Terminal",
        active: true,
        cwd: "/home/user/projects/meridia",
        shell: "bash",
        icon: terminalIcon,
      },
      {
        id: `console`,
        name: "Console",
        active: false,
        cwd: "/home/user/projects/meridia",
        shell: "bash",
        icon: consoleIcon,
      },
      {
        id: `run`,
        name: "Run",
        active: false,
        cwd: "/home/user/projects/meridia",
        shell: "bash",
        icon: runIcon,
      },
    ];

    this._tabs = sampleTabs;
    this._renderTabs();
  }

  public toggleCollapse() {
    this._isCollapsed = !this._isCollapsed;
    this._renderTabs();
  }

  public collapse() {
    if (!this._isCollapsed) {
      this._isCollapsed = true;
      this._renderTabs();
    }
  }

  public expand() {
    if (this._isCollapsed) {
      this._isCollapsed = false;
      this._renderTabs();
    }
  }

  public isCollapsed(): boolean {
    return this._isCollapsed;
  }

  private _openPanel(tab: IDevPanelTab) {
    this._contentEl.innerHTML = "";

    let panel = this._panels.get(tab.id);

    if (!panel) {
      if (tab.id === "terminal") {
        panel = new Terminal();
      } else if (tab.id === "console") {
        panel = this._createConsolePanel();
      } else {
        panel = new Terminal();
      }

      this._panels.set(tab.id, panel);
    }

    this._contentEl.appendChild(panel.getDomElement()!);
  }

  private _createConsolePanel(): Terminal {
    const consolePanel = new Terminal();

    return consolePanel;
  }
}
