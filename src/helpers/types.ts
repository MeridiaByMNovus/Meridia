/* eslint-disable @typescript-eslint/ban-types */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) MNovus. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Folder Structure Type
export interface IFolderStructure {
  id: number;
  name: string;
  root: string;
  type: "folder" | "file";
  children: TFolderTree[];
}

// Folder Tree Type
export type TFolderTree = {
  id: number;
  name: string;
  parentPath: string;
  path: string;
  children?: TFolderTree[];
  type: "folder" | "file";
};

// Normal settings
export interface IMainState {
  folder_structure: IFolderStructure;
  active_files: TActiveFile[];
  active_file: TActiveFile;
  settings_tab_active: boolean;
  indent: TIndent;
  data_studio_active: TDataStudioActive;
  env_vars: any;
  set_data_tool_type_tab: DataPreviewToolsTab;
  sidebar_active: boolean;
  right_sidebar_active: boolean;
  bottom_panel_active: boolean;
  toolsdata: any;
  tools_in_a_window: boolean;
  current_bottom_tab: number;
  output_history: [{ output: string }];
  editorSettings: IEditorSettings;
  uiState: IUIState;
}

export interface IUIState {
  active_files: TActiveFile[];
  active_file: TActiveFile;
  current_bottom_tab: number;
  sidebar_active: boolean;
  bottom_panel_active: boolean;
}

export interface IEditorSettings {
  theme: "oneDark" | string;
  fontSize: number;
  fontFamily: string;
  cursorBlinking: "blink" | "smooth" | "phase" | "expand" | "solid";
  cursorSmoothCaretAnimation: "on" | "off";
  minimap: { enabled: boolean };
  quickSuggestions: { other: boolean; comments: boolean; strings: boolean };
  wordBasedSuggestions: "allDocuments" | "currentDocument" | "off";
  automaticLayout: boolean;
  folding: boolean;
  lineNumbers: "on" | "off" | "relative" | "interval";
  largeFileOptimizations: boolean;
  links: boolean;
  acceptSuggestionOnEnter: "on" | "smart" | "off";
  autoClosingBrackets:
    | "always"
    | "languageDefined"
    | "beforeWhitespace"
    | "never";
  formatOnPaste: boolean;
  formatOnType: boolean;
  mouseWheelZoom: boolean;
  contextmenu: boolean;
  bracketPairColorization: { enabled: boolean };
  screenReaderAnnounceInlineSuggestion: boolean;
  parameterHints: { enabled: boolean };
  floatingPreview: boolean;
}

export type TDataStudioActive = {
  active: boolean;
};

// Active File Type
export type TActiveFile = {
  path: string;
  name: any;
  icon: string;
  is_touched: boolean;
  content: string;
};

// Editor Indent Type
export type TIndent = {
  line: number;
  column: number;
  selected: number;
};

// Selected file by Editor (or tab) Type
export type TSelectedFile = {
  name: string;
  path: string;
  content: string;
};

export type TEnvVars = {
  vars: TEnvVar[];
};

export type TEnvVar = {
  name: string;
  type: string;
  value: any;
};

export type DataPreviewToolsTab = {
  active: boolean;
  data: any[];
};

// Main Context Functions Type
export interface IMainContext {
  handle_set_editor: Function;
  handle_remove_editor: Function;
  handle_save_file: Function;
}
