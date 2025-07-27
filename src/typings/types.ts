export interface IMainState {
  folder_structure: IFolderStructure;
  editor_tabs: IEditorTab[];
  editor_active_tab: IEditorTab;
  terminal_tabs: ITab[];
  terminal_active_tab: ITab;
  active_sidebaritem: string;
}

export interface IEditorTab {
  name: string;
  icon: string;
  active: boolean;
  is_touched: boolean;
  uri: string;
  language?: string;
  initialContent?: string;
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

export type ITab = {
  icon: string;
  name: string;
  active: boolean;
};

export type ThemeKind = "light" | "dark";

export type Theme = {
  name: string;
  kind: ThemeKind;
  colors: Record<string, string>;
  tokenColors?: Record<string, string>;
  semanticTokens?: Record<string, string>;
};
