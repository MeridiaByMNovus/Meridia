import { Mira as MiraLayout } from "./browser/workbench.mira.layout.js";
import { registerStandalone } from "../../../workbench/common/workbench.standalone.js";
import { createFile } from "../mira.actions/mira.actions.files.js";

export class Mira {
  constructor() {
    new MiraLayout();
  }
}

const _mira = new Mira();
registerStandalone("mira", _mira);
