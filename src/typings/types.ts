export interface IMainState {
  folder_structure: IFolderStructure;
  editor_tabs: ITab[];
  editor_active_tab: ITab;
  terminal_tabs: ITab[];
  terminal_active_tab: ITab;
  console_tabs: ITab[];
  console_active_tab: ITab;
  run_tabs: ITab[];
  run_active_tab: ITab;
  active_activityBaritem: ActiveActivityBarItem;
  panel_state: PanelState;
}

export interface ActiveActivityBarItem {
  left: {
    top: string;
    bottom: string;
  };
  right: {
    top: string;
    bottom: string;
  };
}

export interface PanelState {
  left: "on" | "off";
  right: "on" | "off";
  bottom: "on" | "off";
}

export interface IContentTab {
  id: any;
  name: string;
  icon: string;
  active: boolean;
  content: HTMLElement;
}

export interface ITab {
  id: any;
  name: string;
  icon?: string;
  active: boolean;
  is_touched?: boolean;
  uri?: string;
  content?: string;
  language?: string;
}

export interface IFolderStructure {
  id: number;
  name: string;
  root: string;
  type: "folder" | "file";
  children: TFolderTree[];
}

export type TFolderTree = {
  id: number;
  name: string;
  parentPath: string;
  path: string;
  children?: TFolderTree[];
  type: "folder" | "file";
};

export type ThemeKind = "light" | "dark" | "highContrast";

export const knownColorKeys = [
  "workbench.background",
  "workbench.foreground",
  "editor.background",
  "editor.foreground",
  "editor.lineHighlightBackground",
  "editor.tab.containerBackground",
  "editor.fileTouched.icon.foreground",
  "cursor.foreground",
  "activityBar.background",
  "activityBar.foreground",
  "titleBar.activeBackground",
  "statusBar.background",
  "activityBar.background",
  "extensionViewlet.background",
  "activityBarContent.background",
  "activityBar.item.activebackground",
  "activityBar.item.activeforeground",
  "quickInput.background",
  "tab.containerBackground",
  "tab.activeBorder",
  "tab.activeForeground",
  "tab.inactiveForeground",
  "button.foreground",
  "settings.editor.background",
  "settings.activityBar.background",
  "terminal.background",
  "terminal.tab.activeBorder",
  "input.background",
  "dropdown.background",
  "editorHoverWidget.background",
  "border.foreground",
  "focusBorder",
  "foreground",
  "descriptionForeground",
  "workbench.icon.foreground",
  "workbench.hoverBackground",
  "titleBar.activeBorder",
  "menu.background",
  "menu.separatorBackground",
  "tree.indentGuidesStroke",
  "scrollbarSlider.background",
  "scrollbarSlider.hoverBackground",
  "scrollbarSlider.activeBackground",
  "splitView.dragAndDropBackground",
  "splitView.inactiveBackground",
  "explorer.foreground",
  "explorer.icon.foreground",
  "explorer.text.activeforeground",
  "explorer.icon.activeforeground",
  "explorer.activebackground",
  "explorer.hoverbackground",
  "explorer.input.activeborder",
  "explorer.input.border",
  "titleBar.border",
  "textLink.foreground",
  "accent.green",
  "accent.red",
  "accent.blue",
  "settings.headerBackground",
  "settings.contentBackground",
  "settings.sidebarBackground",
  "settings.focusedRowBackground",
  "settings.rowHoverBackground",
  "settings.dropdownBackground",
  "settings.dropdownForeground",
  "settings.dropdownBorder",
  "settings.checkboxBackground",
  "settings.checkboxForeground",
  "settings.checkboxBorder",
  "settings.textInputBackground",
  "settings.textInputForeground",
  "settings.textInputBorder",
  "settings.numberInputBackground",
  "settings.numberInputForeground",
  "settings.numberInputBorder",
  "settings.modifiedItemIndicator",

  "button.background",
  "button.hoverBackground",
  "button.activeBackground",
  "button.secondaryBackground",
  "button.secondaryForeground",
  "button.secondaryHoverBackground",
  "button.dangerBackground",
  "button.dangerForeground",
  "button.dangerHoverBackground",
  "modal.background",
  "modal.foreground",
  "modal.border",
  "modal.backdrop",
  "notification.background",
  "notification.foreground",
  "notification.border",
  "notification.successBackground",
  "notification.errorBackground",
  "notification.warningBackground",
  "dialog.background",
  "dialog.foreground",
  "dialog.border",
  "panel.background",
  "panel.foreground",
  "panel.border",

  "gemini.background",
  "gemini.foreground",
  "gemini.border",
  "gemini.headingGradient",
  "gemini.tabsBackground",
  "gemini.tabsBorder",
  "gemini.tabActiveBackground",
  "gemini.tabActiveForeground",
  "gemini.tabInactiveBackground",
  "gemini.tabInactiveForeground",
  "gemini.tabHoverBackground",
  "gemini.agentBackground",
  "gemini.agentForeground",
  "gemini.chatBackground",
  "gemini.chatForeground",
  "gemini.chatboxBackground",
  "gemini.chatboxBorder",
  "gemini.chatboxForeground",
  "gemini.userchatBackground",
  "gemini.userchatForeground",
  "gemini.userchatBorder",
  "gemini.assistantchatForeground",
  "gemini.sendButtonBackground",
  "gemini.sendButtonForeground",
  "gemini.sendButtonHoverBackground",
] as const;

export type KnownColorKey = (typeof knownColorKeys)[number];

export type Theme = {
  name: string;
  kind: ThemeKind;
  colors: Partial<Record<KnownColorKey, string>>;
  tokenColors?: Record<string, string>;
  semanticTokens?: Record<string, string>;
};
