import { ElementCore } from "./elementCore.js";

export class TerminalLayoutWrapper extends ElementCore {
  constructor() {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "terminal-layout-wrapper";
  }
}
