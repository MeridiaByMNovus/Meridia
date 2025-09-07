import { EditorController } from "./common/controller/EditorController.js";
import { ElementCore } from "./elementCore.js";

export class EditorLayout extends ElementCore {
  constructor() {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "editor-layout-wrapper";

    new EditorController(this);
  }
}
