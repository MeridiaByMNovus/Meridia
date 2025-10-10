import { api as _editor } from "./workbench.editor.api.js";
import { api as _statusbar } from "./workbench.statusbar.api.js";

function _merge(...apis: any[]) {
  const result: any = {};

  for (const api of apis) {
    for (const [key, value] of Object.entries(api)) {
      if (key === "window" && result.window) {
        result.window = { ...result.window, ...value! };
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

export const api = {
  workbench: _merge(_editor, _statusbar),
};
