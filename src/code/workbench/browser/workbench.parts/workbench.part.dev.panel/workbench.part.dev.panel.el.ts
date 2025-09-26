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
    this._content.className = "panel content scrollbar-container x-disable";

    this._tabs = new DevPanelTabs(this._content, this);

    this._splitter = new Splitter(
      [this._content, this._tabs.getDomElement()!],
      "horizontal",
      [70, 30]
    );
    this._splitter.getDomElement()!.classList.add("height");

    this._el.appendChild(this._splitter.getDomElement()!);

    if (this._isCollapsed) this._collapse();
    else this._expand();

    registerStandalone("dev-panel-splitter", this._splitter);
  }

  public _collapse() {
    this._el!.innerHTML = "";
    this._el!.classList.add("collapsed");
    this._el?.appendChild(this._content);
    this._el?.appendChild(this._tabs.getDomElement()!);
    this._content.style.width = "calc(100% - 70px)";
    this._tabs.collapse();
    this._isCollapsed = true;
    window.storage.store("dev-panel-tabs-is-collapsed", true);
  }

  public _expand() {
    this._el!.innerHTML = "";
    this._el!.classList.remove("collapsed");
    const _splitter = new Splitter(
      [this._content, this._tabs.getDomElement()!],
      "horizontal",
      [70, 30]
    );
    _splitter.getDomElement()!.classList.add("height");
    this._el?.appendChild(_splitter.getDomElement()!);
    this._tabs.expand();
    this._isCollapsed = false;
    window.storage.store("dev-panel-tabs-is-collapsed", false);
  }

  public _toggle() {
    if (this._isCollapsed) {
      this._expand();
    } else {
      this._collapse();
    }

    window.storage.store("dev-panel-tabs-is-collapsed", this._isCollapsed);
  }
}
