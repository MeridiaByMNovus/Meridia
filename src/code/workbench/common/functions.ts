import { ITab, KnownColorKey, knownColorKeys } from "../../../typings/types.js";
import { update_editor_tabs } from "./store/mainSlice.js";
import { dispatch, store } from "./store/store.js";

export const get_file_types = (file_name: string) => {
  const fileTypes = {
    ".gitignore": "ignore",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".go": "go",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kotlin": "kotlin",
    ".dart": "dart",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".xls": "excel",
    ".xlsx": "excel",
    ".csv": "csv",
  } as const;

  const match = Object.keys(fileTypes).find((ext) =>
    file_name.toLowerCase().endsWith(ext)
  );

  return match ? fileTypes[match as keyof typeof fileTypes] : "text";
};

export const tokensToCssVariables: Record<KnownColorKey, string> = {
  "workbench.background": "--main-bg",
  "workbench.foreground": "--text-color",
  "editor.background": "--editor-bg",
  "editor.foreground": "--text-color",
  "editor.lineHighlightBackground": "--line-highlight-bg",
  "editor.tab.containerBackground": "--editor-tabs-bg",
  "cursor.foreground": "--cursor-color",
  "activityBar.background": "--activity-bar-bg",
  "activityBar.foreground": "--activity-bar-text",
  "activityBar.item.activebackground": "--activity-bar-active-background",
  "activityBar.item.activeforeground": "--activity-bar-active-foreground",
  "titleBar.activeBackground": "--titlebar-bg",
  "statusBar.background": "--status-bar-bg",
  "extensionViewlet.background": "--extension-bg",
  "activityBarContent.background": "--content-bg",
  "quickInput.background": "--command-palette-bg",
  "tab.containerBackground": "--tabs-wrapper-bg",
  "tab.activeBorder": "--active-border",
  "tab.activeForeground": "--tab-active-text-color",
  "tab.inactiveForeground": "--tab-text-color",
  "button.foreground": "--active-icon-color",
  "editor.fileTouched.icon.foreground": "--file-touched-color",
  "settings.editor.background": "--settings-bg",
  "settings.activityBar.background": "--settings-activityBar-bg",
  "terminal.background": "--terminal-bg",
  "terminal.tab.activeBorder": "--tab-active-border",
  "input.background": "--input-bg",
  "dropdown.background": "--dropdown-bg",
  "editorHoverWidget.background": "--tooltip-bg",
  "border.foreground": "--border-color",
  focusBorder: "--focus-color",
  foreground: "--text-color",
  descriptionForeground: "--second-text-color",
  "workbench.icon.foreground": "--icon-color",
  "workbench.hoverBackground": "--hover-bg",
  "titleBar.activeBorder": "--titlebar-border",
  "menu.background": "--submenu-bg",
  "menu.separatorBackground": "--separator",
  "tree.indentGuidesStroke": "--file-tree-folder-content-border-color",
  "scrollbarSlider.background": "--scrollbar-color",
  "scrollbarSlider.activeBackground": "--active-scrollbar-color",
  "scrollbarSlider.hoverBackground": "--hover-scrollbar-color",
  "splitView.dragAndDropBackground": "--splitter-active-color",
  "splitView.inactiveBackground": "--splitter-color",
  "explorer.foreground": "--file-tree-foreground",
  "explorer.icon.foreground": "--file-tree-icon-foreground",
  "explorer.icon.activeforeground": "--file-tree-icon-active-foreground",
  "explorer.text.activeforeground": "--file-tree-text-active-foreground",
  "explorer.activebackground": "--file-tree-active-background",
  "explorer.hoverbackground": "--file-tree-hover-background",
  "explorer.input.activeborder": "--file-tree-active-border",
  "explorer.input.border": "--file-tree-border",
  "titleBar.border": "--titlebar-border",
  "textLink.foreground": "--blue-color",
  "accent.green": "--green-color",
  "accent.red": "--red-color",
  "accent.blue": "--blue-color",
  "settings.headerBackground": "--settings-header-background",
  "settings.contentBackground": "--settings-content-background",
  "settings.sidebarBackground": "--settings-nav-background",
  "settings.focusedRowBackground": "--settings-nav-active-background",
  "settings.rowHoverBackground": "--settings-nav-hover",
  "settings.dropdownBackground": "--settings-input-background",
  "settings.dropdownForeground": "--settings-input-foreground",
  "settings.dropdownBorder": "--settings-input-border",
  "settings.checkboxBackground": "--settings-toggle-background",
  "settings.checkboxForeground": "--settings-toggle-slider",
  "settings.checkboxBorder": "--settings-toggle-border",
  "settings.textInputBackground": "--settings-input-background",
  "settings.textInputForeground": "--settings-input-foreground",
  "settings.textInputBorder": "--settings-input-border",
  "settings.numberInputBackground": "--settings-input-background",
  "settings.numberInputForeground": "--settings-input-foreground",
  "settings.numberInputBorder": "--settings-input-border",
  "settings.modifiedItemIndicator": "--settings-modified-indicator",

  "button.background": "--button-bg",
  "button.hoverBackground": "--button-hover-bg",
  "button.activeBackground": "--button-active-bg",
  "button.secondaryBackground": "--button-secondary-bg",
  "button.secondaryForeground": "--button-secondary-text",
  "button.secondaryHoverBackground": "--button-secondary-hover-bg",
  "button.dangerBackground": "--button-danger-bg",
  "button.dangerForeground": "--button-danger-text",
  "button.dangerHoverBackground": "--button-danger-hover-bg",
  "modal.background": "--modal-bg",
  "modal.foreground": "--modal-text",
  "modal.border": "--modal-border",
  "modal.backdrop": "--modal-backdrop",
  "notification.background": "--notification-bg",
  "notification.foreground": "--notification-text",
  "notification.border": "--notification-border",
  "notification.successBackground": "--notification-success-bg",
  "notification.errorBackground": "--notification-error-bg",
  "notification.warningBackground": "--notification-warning-bg",
  "dialog.background": "--dialog-bg",
  "dialog.foreground": "--dialog-text",
  "dialog.border": "--dialog-border",
  "panel.background": "--panel-bg",
  "panel.foreground": "--panel-text",
  "panel.border": "--panel-border",

  "gemini.background": "--gm-bg",
  "gemini.foreground": "--gm-color",
  "gemini.border": "--gm-border",
  "gemini.headingGradient": "--gm-head-grad",
  "gemini.tabsBackground": "--gm-tabs-bg",
  "gemini.tabsBorder": "--gm-tabs-border",
  "gemini.tabActiveBackground": "--gm-tab-active-bg",
  "gemini.tabActiveForeground": "--gm-tab-active-color",
  "gemini.tabInactiveBackground": "--gm-tab-bg",
  "gemini.tabInactiveForeground": "--gm-tab-color",
  "gemini.tabHoverBackground": "--gm-tab-hover-bg",
  "gemini.agentBackground": "--gm-agent-bg",
  "gemini.agentForeground": "--gm-agent-color",
  "gemini.chatBackground": "--gm-chat-bg",
  "gemini.chatForeground": "--gm-chat-color",
  "gemini.chatboxBackground": "--gm-chatbox-bg",
  "gemini.chatboxBorder": "--gm-chatbox-border",
  "gemini.chatboxForeground": "--gm-chatbox-color",
  "gemini.userchatBackground": "--gm-chatbox-user-bg",
  "gemini.userchatForeground": "--gm-chatbox-user-color",
  "gemini.userchatBorder": "--gm-chatbox-user-border",
  "gemini.assistantchatForeground": "--gm-chatbox-assistant-color",
  "gemini.sendButtonBackground": "--gm-send-btn-bg",
  "gemini.sendButtonForeground": "--gm-send-btn-color",
  "gemini.sendButtonHoverBackground": "--gm-send-btn-hover-bg",
};

export function parseTokensToCssVariables(
  colors: Partial<Record<KnownColorKey, string>>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of knownColorKeys) {
    const cssVar = tokensToCssVariables[key];
    const value = colors[key];
    if (cssVar && value) result[cssVar] = value;
  }
  return result;
}

export function handleOpenSettingsTab() {
  const existingTabs = store.getState().main.editor_tabs;
  const existingTab = existingTabs.find(
    (t) => t.content === "elements://settings"
  );

  if (existingTab) {
    dispatch(
      update_editor_tabs(
        existingTabs.map((t) => ({
          ...t,
          active: t.content === "elements://settings",
        }))
      )
    );
  } else {
    const updatedTabs = [
      ...existingTabs.map((t) => ({ ...t, active: false })),
      {
        id: Date.now(),
        customIcon: `<svg viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="var(--icon-color)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>settings</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-101.000000, -360.000000)" fill="var(--icon-color)"> <path d="M128.52,381.134 L127.528,382.866 C127.254,383.345 126.648,383.508 126.173,383.232 L123.418,381.628 C122.02,383.219 120.129,384.359 117.983,384.799 L117.983,387 C117.983,387.553 117.54,388 116.992,388 L115.008,388 C114.46,388 114.017,387.553 114.017,387 L114.017,384.799 C111.871,384.359 109.98,383.219 108.582,381.628 L105.827,383.232 C105.352,383.508 104.746,383.345 104.472,382.866 L103.48,381.134 C103.206,380.656 103.369,380.044 103.843,379.769 L106.609,378.157 C106.28,377.163 106.083,376.106 106.083,375 C106.083,373.894 106.28,372.838 106.609,371.843 L103.843,370.232 C103.369,369.956 103.206,369.345 103.48,368.866 L104.472,367.134 C104.746,366.656 105.352,366.492 105.827,366.768 L108.582,368.372 C109.98,366.781 111.871,365.641 114.017,365.201 L114.017,363 C114.017,362.447 114.46,362 115.008,362 L116.992,362 C117.54,362 117.983,362.447 117.983,363 L117.983,365.201 C120.129,365.641 122.02,366.781 123.418,368.372 L126.173,366.768 C126.648,366.492 127.254,366.656 127.528,367.134 L128.52,368.866 C128.794,369.345 128.631,369.956 128.157,370.232 L125.391,371.843 C125.72,372.838 125.917,373.894 125.917,375 C125.917,376.106 125.72,377.163 125.391,378.157 L128.157,379.769 C128.631,380.044 128.794,380.656 128.52,381.134 L128.52,381.134 Z M130.008,378.536 L127.685,377.184 C127.815,376.474 127.901,375.749 127.901,375 C127.901,374.252 127.815,373.526 127.685,372.816 L130.008,371.464 C130.957,370.912 131.281,369.688 130.733,368.732 L128.75,365.268 C128.203,364.312 126.989,363.983 126.041,364.536 L123.694,365.901 C122.598,364.961 121.352,364.192 119.967,363.697 L119.967,362 C119.967,360.896 119.079,360 117.983,360 L114.017,360 C112.921,360 112.033,360.896 112.033,362 L112.033,363.697 C110.648,364.192 109.402,364.961 108.306,365.901 L105.959,364.536 C105.011,363.983 103.797,364.312 103.25,365.268 L101.267,368.732 C100.719,369.688 101.044,370.912 101.992,371.464 L104.315,372.816 C104.185,373.526 104.099,374.252 104.099,375 C104.099,375.749 104.185,376.474 104.315,377.184 L101.992,378.536 C101.044,379.088 100.719,380.312 101.267,381.268 L103.25,384.732 C103.797,385.688 105.011,386.017 105.959,385.464 L108.306,384.099 C109.402,385.039 110.648,385.809 112.033,386.303 L112.033,388 C112.033,389.104 112.921,390 114.017,390 L117.983,390 C119.079,390 119.967,389.104 119.967,388 L119.967,386.303 C121.352,385.809 122.598,385.039 123.694,384.099 L126.041,385.464 C126.989,386.017 128.203,385.688 128.75,384.732 L130.733,381.268 C131.281,380.312 130.957,379.088 130.008,378.536 L130.008,378.536 Z M116,378 C114.357,378 113.025,376.657 113.025,375 C113.025,373.344 114.357,372 116,372 C117.643,372 118.975,373.344 118.975,375 C118.975,376.657 117.643,378 116,378 L116,378 Z M116,370 C113.261,370 111.042,372.238 111.042,375 C111.042,377.762 113.261,380 116,380 C118.739,380 120.959,377.762 120.959,375 C120.959,372.238 118.739,370 116,370 L116,370 Z" id="settings" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>`,
        name: "Settings",
        active: true,
        content: "elements://settings",
        fileIcon: "settings",
      },
    ];
    dispatch(update_editor_tabs(updatedTabs));
  }
}

export const randomUUID = () => crypto.randomUUID();
