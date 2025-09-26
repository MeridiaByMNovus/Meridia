import { CoreEl } from "./workbench.part.el.js";

export class PanelOption extends CoreEl {
  constructor(
    private _name?: string,
    private _onClickCallback?: Function,
    private _icon?: string
  ) {
    super();
    this._createEl();
  }

  private _createEl() {
    this._el = document.createElement("span");
    if (this._icon) this._el.innerHTML = this._icon;
    else this._el.innerHTML = this._name!;

    if (this._onClickCallback) this._onClickCallback();
  }
}
