import { CoreEl } from "../../../../workbench/browser/workbench.parts/workbench.part.el.js";
import { getIcon } from "../../../../workbench/common/workbench.utils.js";
import { _mic } from "../../mira.engine/mira.engine.mic.js";
import { _voice } from "../../mira.engine/mira.engine.voice.js";

export class Mira extends CoreEl {
  constructor() {
    super();
    this._createEl();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "mira";

    // const _cursor = document.createElement("span");
    // _cursor.innerHTML = getIcon("cursor/cursor.svg");
    // _cursor.className = "cursor";

    // document.body.appendChild(_cursor);

    const scale = document.createElement("div");
    scale.className = "scale-0";

    const circle1 = document.createElement("div");
    circle1.className = "circle circle-1";
    const circle2 = document.createElement("div");
    circle2.className = "circle circle-2";
    const circle3 = document.createElement("div");
    circle3.className = "circle circle-3";

    scale.appendChild(circle1);
    scale.appendChild(circle2);
    scale.appendChild(circle3);

    const transcriptionText = document.createElement("div");
    transcriptionText.id = "transcriptionText";
    transcriptionText.className = "transcription-text";

    this._el.appendChild(transcriptionText);
    this._el.appendChild(scale);

    setTimeout(async () => {
      _mic._start();
    }, 100);
  }
}
