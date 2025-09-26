import {
  Terminal,
  init_workbench_part_terminal
} from "./chunk-RTMP7QB4.js";
import {
  Panel,
  init_workbench_part_panel
} from "./chunk-QNNCGGPS.js";
import {
  init_perfect_scrollbar_esm,
  perfect_scrollbar_esm_default
} from "./chunk-VKGV2SFM.js";
import {
  collapseIcon,
  consoleIcon,
  eillipsisIcon,
  expandIcon,
  init_workbench_icons,
  runIcon,
  terminalIcon
} from "./chunk-UTYDY5QB.js";
import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.tabs.ts
var DevPanelTabs;
var init_workbench_part_dev_panel_tabs = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.tabs.ts"() {
    init_perfect_scrollbar_esm();
    init_workbench_icons();
    init_workbench_part_el();
    init_workbench_part_panel();
    init_workbench_part_terminal();
    DevPanelTabs = class extends CoreEl {
      constructor(contentEl, _devPanel) {
        super();
        this._devPanel = _devPanel;
        this._contentEl = contentEl;
        this._createEl();
        this.initializeTabs();
      }
      _tabs = [];
      _contentEl;
      _panels = /* @__PURE__ */ new Map();
      _isCollapsed = false;
      _createEl() {
        this._el = new Panel("tabs").getDomElement();
        this._el.className = "panel vertical";
        this._el.style.height = "100%";
        this._el.style.width = "fit-content";
        this._renderTabs();
      }
      _renderTabs() {
        const existingTabsContainer = this._el.querySelector(".tabs");
        const existingCollapseIcon = this._el.querySelector(".collapse");
        if (existingTabsContainer) {
          existingTabsContainer.remove();
        }
        if (existingCollapseIcon) {
          existingCollapseIcon.remove();
        }
        const tabsContainer = document.createElement("div");
        tabsContainer.className = "tabs vertical";
        new perfect_scrollbar_esm_default(tabsContainer);
        if (!tabsContainer) return;
        const activeTab = this._tabs.find((t) => t.active);
        if (activeTab) {
          this._openPanel(activeTab);
        }
        this._tabs.forEach((tab) => {
          const tabEl = document.createElement("div");
          tabEl.className = `tab ${tab.active ? "active" : ""}`;
          tabEl.onclick = (e) => {
            if (e.target.closest(".close-icon")) {
              return;
            }
            this._tabs = this._tabs.map((t) => ({
              ...t,
              active: t.id === tab.id
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
        console.log(_devPanel);
        const collapse = document.createElement("span");
        collapse.className = "collapse";
        collapse.innerHTML = _devPanel._isCollapsed ? collapseIcon : expandIcon;
        collapse.onclick = () => {
          _devPanel._toggle();
        };
        this._el.appendChild(tabsContainer);
        this._el.appendChild(collapse);
      }
      initializeTabs() {
        this._tabs = [];
        const sampleTabs = [
          {
            id: `terminal`,
            name: "Terminal",
            active: true,
            cwd: "/home/user/projects/meridia",
            shell: "bash",
            icon: terminalIcon
          },
          {
            id: `console`,
            name: "Console",
            active: false,
            cwd: "/home/user/projects/meridia",
            shell: "bash",
            icon: consoleIcon
          },
          {
            id: `run`,
            name: "Run",
            active: false,
            cwd: "/home/user/projects/meridia",
            shell: "bash",
            icon: runIcon
          }
        ];
        this._tabs = sampleTabs;
        this._renderTabs();
      }
      toggleCollapse() {
        this._isCollapsed = !this._isCollapsed;
        this._renderTabs();
      }
      collapse() {
        if (!this._isCollapsed) {
          this._isCollapsed = true;
          this._renderTabs();
        }
      }
      expand() {
        if (this._isCollapsed) {
          this._isCollapsed = false;
          this._renderTabs();
        }
      }
      isCollapsed() {
        return this._isCollapsed;
      }
      _openPanel(tab) {
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
        this._contentEl.appendChild(panel.getDomElement());
      }
      _createConsolePanel() {
        const consolePanel = new Terminal();
        return consolePanel;
      }
    };
  }
});

export {
  DevPanelTabs,
  init_workbench_part_dev_panel_tabs
};
