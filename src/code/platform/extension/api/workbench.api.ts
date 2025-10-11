import { _merge } from "../common/extension.utils.js";
import { api as _editor } from "./workbench.editor.api.js";
import { api as _statusbar } from "./workbench.statusbar.api.js";

export const api = {
  workbench: _merge(_editor, _statusbar),
};
