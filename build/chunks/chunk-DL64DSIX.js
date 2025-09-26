import {
  DevPanelTabs,
  init_workbench_part_dev_panel_tabs
} from "./chunk-SZXDG5JL.js";
import {
  Panel,
  init_workbench_part_panel
} from "./chunk-QNNCGGPS.js";
import {
  Splitter,
  init_workbench_part_splitter
} from "./chunk-6RUPFKXE.js";
import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.el.ts
var DevPanel;
var init_workbench_part_dev_panel_el = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.el.ts"() {
    init_workbench_standalone();
    init_workbench_part_el();
    init_workbench_part_panel();
    init_workbench_part_splitter();
    init_workbench_part_dev_panel_tabs();
    DevPanel = class extends CoreEl {
      _content;
      _tabs;
      _splitter;
      _isCollapsed;
      constructor() {
        super();
        const _collapsed = window.storage.get("dev-panel-tabs-is-collapsed");
        if (_collapsed) this._isCollapsed = _collapsed;
        else this._isCollapsed = false;
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "dev-panel";
        this._content = new Panel("content").getDomElement();
        this._content.className = "panel content scrollbar-container x-disable";
        this._tabs = new DevPanelTabs(this._content, this);
        this._splitter = new Splitter(
          [this._content, this._tabs.getDomElement()],
          "horizontal",
          [70, 30]
        );
        this._splitter.getDomElement().classList.add("height");
        this._el.appendChild(this._splitter.getDomElement());
        if (this._isCollapsed) this._collapse();
        else this._expand();
        registerStandalone("dev-panel-splitter", this._splitter);
      }
      _collapse() {
        this._el.innerHTML = "";
        this._el.classList.add("collapsed");
        this._el?.appendChild(this._content);
        this._el?.appendChild(this._tabs.getDomElement());
        this._content.style.width = "calc(100% - 70px)";
        this._tabs.collapse();
        this._isCollapsed = true;
        window.storage.store("dev-panel-tabs-is-collapsed", true);
      }
      _expand() {
        this._el.innerHTML = "";
        this._el.classList.remove("collapsed");
        const _splitter = new Splitter(
          [this._content, this._tabs.getDomElement()],
          "horizontal",
          [70, 30]
        );
        _splitter.getDomElement().classList.add("height");
        this._el?.appendChild(_splitter.getDomElement());
        this._tabs.expand();
        this._isCollapsed = false;
        window.storage.store("dev-panel-tabs-is-collapsed", false);
      }
      _toggle() {
        if (this._isCollapsed) {
          this._expand();
        } else {
          this._collapse();
        }
        window.storage.store("dev-panel-tabs-is-collapsed", this._isCollapsed);
      }
    };
  }
});

export {
  DevPanel,
  init_workbench_part_dev_panel_el
};
