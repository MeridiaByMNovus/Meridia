import { registerStandalone } from "../../../common/workbench.standalone.js";
import { CoreEl } from "../workbench.part.el.js";
import { Panel } from "../workbench.part.panel.js";
import { Splitter } from "../workbench.part.splitter.js";
import { DevPanelTabs } from "./workbench.part.dev.panel.tabs.js";

export class DevPanel extends CoreEl {
  private _content!: HTMLElement;
  private _tabs!: DevPanelTabs;
  private _splitter!: Splitter;
  public _isCollapsed: boolean;

  constructor() {
    super();
    const _collapsed = window.storage.get("dev-panel-tabs-is-collapsed");
    if (_collapsed) this._isCollapsed = _collapsed;
    else this._isCollapsed = false;
    this._createEl();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "dev-panel";

    this._content = new Panel("content").getDomElement()!;
    this._content.className =
      "panel content scrollbar-container x-disable y-disable";

    this._tabs = new DevPanelTabs(this._content, this);
    registerStandalone("dev-panel-tabs", this._tabs);

    this._el.classList.add("collapsed");
    this._el.appendChild(this._content);
    this._el.appendChild(this._tabs.getDomElement()!);
    this._content.style.width = "calc(100% - 70px)";
  }
}
