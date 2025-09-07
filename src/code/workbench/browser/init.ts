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
import { StatusBarController } from "./common/controller/StatusBarController.js";
import { Core } from "../../platform/extension/core.js";
import { LayoutService } from "./common/services/LayoutService.js";

export function init(core: Core, layoutService: LayoutService) {
  const SettingsEl = new SettingsLayout();
  TabContentManager.addContent(
    "elements://settings",
    SettingsEl.getDomElement()
  );

  ShortcutsManager.attachIpcRendererListner(
    "new-file-tab",
    debounce(async () => {
      const { path, name } = await window.electron.createTempPythonFile();

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

  core.on("workbench.tab.registerContent", (uri, content) => {
    TabContentManager.addContent(uri, content);
  });

  core.on("workbench.titlebar.registerAction", (innerHtml, id, action) => {
    const wrapper = document.querySelector(".titlebar") as HTMLDivElement;
    const commandsSection = wrapper.querySelector(
      ".commands"
    ) as HTMLDivElement;
    const actionButton = document.createElement("button");
    actionButton.id = id;
    actionButton.innerHTML = innerHtml;
    actionButton.onclick = action;
    commandsSection.appendChild(actionButton);
  });

  core.on("workbench.file.openTab", async (tab: ITab) => {
    const tabs = store.getState().main.editor_tabs || [];
    const existingTab = tabs.find((t) => t.uri === tab.id);

    if (existingTab) {
      const updatedTabs = tabs.map((tab) => ({
        ...tab,
        active: tab.id === existingTab.id,
      }));

      dispatch(update_editor_tabs(updatedTabs));
    } else {
      const deactivatedTabs = tabs.map((t) => ({ ...t, active: false }));

      const updatedTabs = [...deactivatedTabs, tab];

      dispatch(update_editor_tabs(updatedTabs));
    }
  });

  core.on(
    "workbench.activityBar.registerItem",
    (id, icon, position, content, onClickHook?) => {
      layoutService.RegisterActivityBarItem(
        layoutService.getActivityBar("left")!,
        content,
        layoutService
          .getActivityBarContent("leftActivityBarContent")!
          .getDomElement() as HTMLDivElement,
        icon,
        id,
        position,
        false,
        onClickHook
      );
    }
  );

  core.on("workbench.statusBar.registerItem", (item: HTMLSpanElement) => {
    StatusBarController.getInstance().addItemToGlobal(item);
  });
}
