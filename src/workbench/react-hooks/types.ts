/* eslint-disable @typescript-eslint/ban-types */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) MNovus. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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

export interface IMainState {
  folder_structure: IFolderStructure;
  active_files: TActiveFile[];
  active_file: TActiveFile;
  simple_tab: TSimpleTab;
  simple_tabs: TSimpleTab[];
  panel_state: TPanelState;
  project_options: TProjectOptions;
  indent: TIndent;
  loading: TLoading;
  layout: TLayout;
}

export interface TLayout {
  layout: "layout_1" | "layout_2" | "layout_3" | "layout_4";
}

export interface TProjectOptions {
  python_path: string;
  python_version_tag: string;
  python_version: string;
}

export interface TLoading {
  editor: boolean;
  terminal: boolean;
}

export interface TProjectData {
  path: string;
  is_python: boolean;
  python_path?: string;
  python_version_tag?: string;
  python_version?: string;
  conda_path?: string;
  git: boolean;
  welcome_script: boolean;
}

export interface TPanelState {
  right_panel: boolean;
  left_panel: boolean;
  bottom_panel: boolean;
}

export type TActiveFile = {
  path: string;
  name: any;
  icon: string;
  is_touched: boolean;
  diagnostic_state: string;
  content: string;
};

export type TSimpleTab = {
  id: string;
  name: string;
  icon?: string;
  component: string;
  props: any;
};

export type TIndent = {
  line: number;
  column: number;
};

export type TSelectedFile = {
  name: string;
  path: string;
  content: string;
};

export interface IMainContext {
  handle_set_editor: Function;
  handle_set_tab: Function;
  handle_remove_editor: Function;
  handle_save_file: Function;
  handle_save_current_file: Function;
}
