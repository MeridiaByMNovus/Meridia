import debounce from "lodash.debounce";
import { TabContentManager } from "./common/manager/tabContentManager.js";
import { SettingsLayout } from "./settingsLayout.js";
import { dispatch, store } from "../common/store/store.js";
import {
  update_editor_tabs,
  update_panel_state,
} from "../common/store/mainSlice.js";
import { handleOpenSettingsTab, randomUUID } from "../common/functions.js";
import { ShortcutsManager } from "./common/manager/shortcutsManager.js";
import { ITab } from "../../../typings/types.js";
import { Core } from "../../platform/extension/core.js";
import { LayoutService } from "./common/services/LayoutService.js";
import { EditorService } from "../../editor/common/EditorService.js";
import { RegisterCoreRequestManager } from "./common/manager/coreRequestManager.js";

export function init(
  core: Core,
  layoutService: LayoutService,
  editorService: EditorService
) {
  const SettingsEl = new SettingsLayout();
  TabContentManager.addContent(
    "elements://settings",
    SettingsEl.getDomElement()
  );

  ShortcutsManager.attachIpcRendererListner(
    "new-file-tab",
    debounce(async () => {
      const { path, name } = await window.python.createTempPythonFile();

      const tabs = store.getState().main.editor_tabs || [];
      const existingTab = tabs.find((t) => t.uri === path);

      if (existingTab) {
        const updatedTabs = tabs.map((tab) => ({
          ...tab,
          active: tab.id === existingTab.id,
        }));

        dispatch(update_editor_tabs(updatedTabs));
      } else {
        const newTab: ITab = {
          id: randomUUID(),
          fileIcon: "file.py",
          name,
          active: true,
          uri: path,
          is_touched: false,
        };

        const deactivatedTabs = tabs.map((t) => ({ ...t, active: false }));

        const updatedTabs = [...deactivatedTabs, newTab];

        dispatch(update_editor_tabs(updatedTabs));
      }
    })
  );

  ShortcutsManager.attachIpcRendererListner(
    "open-settings",
    debounce(() => {
      handleOpenSettingsTab();
    })
  );

  ShortcutsManager.attachIpcRendererListner(
    "toggle-left-panel",
    debounce(() => {
      const { left, right, bottom } = store.getState().main.panel_state;
      dispatch(
        update_panel_state({
          left: left === "on" ? "off" : "on",
          right,
          bottom,
        })
      );
    })
  );

  ShortcutsManager.attachIpcRendererListner(
    "toggle-bottom-panel",
    debounce(() => {
      const { left, right, bottom } = store.getState().main.panel_state;
      dispatch(
        update_panel_state({
          left,
          right,
          bottom: bottom === "on" ? "off" : "on",
        })
      );
    })
  );

  RegisterCoreRequestManager(core, editorService, layoutService);
}
