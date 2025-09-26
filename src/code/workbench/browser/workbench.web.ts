import { Layout } from "./workbench.layout.js";

export class Web {
  private _layout: Layout;
  constructor() {
    this._layout = new Layout();
  }
}

new Web();
