import PerfectScrollbar from "perfect-scrollbar";
import { IDevTab } from "../../../workbench.types.js";
import {
  eillipsisIcon,
  runIcon,
  terminalIcon,
} from "../../workbench.media/workbench.icons.js";
import { CoreEl } from "../workbench.part.el.js";
import { Panel } from "../workbench.part.panel.js";
import { DevPanel } from "./workbench.part.dev.panel.el.js";
import { Terminal } from "./workbench.part.terminal.js";
import { registerStandalone } from "../../../common/workbench.standalone.js";
import { Run } from "./workbench.part.dev.run.js";

const storage = window.storage;

export class DevPanelTabs extends CoreEl {
  private _tabs: IDevTab[] = [
    {
      id: `terminal`,
      name: "Terminal",
      active: false,
      icon: terminalIcon,
    },
    {
      id: `run`,
      name: "Run",
      active: true,
      icon: runIcon,
    },
  ];
  private _contentEl: HTMLElement;
  private _panels: Map<string, any> = new Map();

  constructor(contentEl: HTMLElement, private _devPanel: DevPanel) {
    super();

    this._contentEl = contentEl;
    this._createEl();
  }

  private _createEl() {
    this._el = new Panel("tabs").getDomElement()!;
    this._el.className = "panel vertical";
    this._el.style.height = "100%";
    this._el.style.width = "fit-content";

    const _tabs = storage.get("dev-panel-tabs");
    if (_tabs) this._tabs = _tabs;

    this._render();
  }

  private _render() {
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
      this._open(activeTab);
    }

    storage.store("dev-panel-tabs", this._tabs);

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

        this._render();
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

      tabsContainer.appendChild(tabEl);
    });

    this._el!.appendChild(tabsContainer);
  }

  private _open(tab: IDevTab) {
    this._contentEl.innerHTML = "";

    let panel = this._panels.get(tab.id);

    if (!panel) {
      if (tab.id === "terminal") {
        panel = new Terminal();
        registerStandalone("terminal", panel);
      } else if (tab.id === "run") {
        panel = new Run();
        registerStandalone("run", panel);
      } else {
        panel = new Terminal();
      }

      this._panels.set(tab.id, panel);
    }

    this._contentEl.appendChild(panel.getDomElement()!);
  }

  public _set(tabId: string): boolean {
    const targetTab = this._tabs.find((tab) => tab.id === tabId);

    if (!targetTab) {
      return false;
    }

    if (targetTab.active) {
      return true;
    }

    this._tabs = this._tabs.map((tab) => ({
      ...tab,
      active: tab.id === tabId,
    }));

    this._render();

    return true;
  }
}
