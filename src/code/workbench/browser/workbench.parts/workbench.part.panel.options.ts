import { CoreEl } from "./workbench.part.el.js";

export class PanelOptions extends CoreEl {
  constructor(
    private _options: HTMLSpanElement[],
    private _parentEl: HTMLElement,
    private _className?: string
  ) {
    super();
    this._createEl();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "panel-options";

    if (this._className) {
      this._el.classList.add(this._className);
    }

    this._options.forEach((_option) => {
      this._el?.appendChild(_option);
    });
  }

  public _updateContent(_contentEl: HTMLElement) {
    this._parentEl.appendChild(_contentEl);
  }
}
