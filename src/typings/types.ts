export interface IMainState {
  folder_structure: IFolderStructure;
  editor_tabs: ITab[];
  editor_active_tab: ITab;
  terminal_tabs: ITab[];
  terminal_active_tab: ITab;
  active_activityBaritem: string;
  panel_state: PanelState;
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
  fileIcon?: string;
  customIcon?: string;
  editorContent?: string;
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
  "tab.inactiveBackground",
  "tab.activeBackground",
  "tab.containerBackground",
  "tab.activeBorder",
  "tab.activeForeground",
  "tab.inactiveForeground",
  "editor.background",
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
] as const;

export type KnownColorKey = (typeof knownColorKeys)[number];

export type Theme = {
  name: string;
  kind: ThemeKind;
  colors: Partial<Record<KnownColorKey, string>>;
  tokenColors?: Record<string, string>;
  semanticTokens?: Record<string, string>;
};
