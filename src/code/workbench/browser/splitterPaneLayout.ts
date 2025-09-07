import { ElementCore } from "./elementCore.js";

export class SplitterPaneLayout extends ElementCore {
  constructor(public id: string) {
    super();

    this.render();
  }

  private render(): HTMLDivElement {
    if (!this.elementEl) {
      this.elementEl = document.createElement("div");
      this.elementEl.id = this.id;
      this.elementEl.className = "splitter-pane-layout";
    }
    return this.elementEl;
  }

  public mount(parent: HTMLDivElement) {
    const el = this.render();
    parent.appendChild(el);
  }

  public addContent(content: HTMLDivElement) {
    const el = this.getDomElement();
    if (el) {
      el.appendChild(content);
    }
  }
}
