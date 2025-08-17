import { ElementCore } from "./elementCore.js";

export class ActivityBarContentLayout extends ElementCore {
  constructor(
    private uniqueId: string,
    private scrollbar?: boolean
  ) {
    super();

    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = `activity-bar-content activity-bar-content-${this.uniqueId} ${this.scrollbar && "scrollbar-container"}`;
  }
}
