import { IStatusBarAction } from "../../../workbench/workbench.types.js";
import { _contextEvent } from "../common/extension.context.js";

export const api = {
  window: {
    createStatusBarItem: (action: IStatusBarAction) => {
      _contextEvent.send("workbench.statusbar.register.action", action);
    },
    removeStatusBarItem: (_innerHtml: string) => {
      _contextEvent.send("workbench.statusbar.remove.action", _innerHtml);
    },
  },
};
