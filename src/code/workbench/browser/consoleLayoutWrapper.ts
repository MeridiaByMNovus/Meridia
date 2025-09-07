import { ElementCore } from "./elementCore.js";

export class ConsoleLayoutWrapper extends ElementCore {
  constructor() {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "console-layout-wrapper";
  }
}
