import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  IFolderStructure,
  IMainState,
  TActiveFile,
  TIndent,
  TLoading,
  TProjectOptions,
  TPanelState,
  TSimpleTab,
  TLayout,
} from "./types";

const initialState: IMainState = {
  folder_structure: {} as IFolderStructure,
  active_files: [],
  active_file: {} as TActiveFile,
  simple_tabs: [],
  simple_tab: {} as TSimpleTab,
  indent: { column: 0, line: 0 } as TIndent,
  panel_state: {
    right_panel: false,
    left_panel: true,
    bottom_panel: true,
  } as TPanelState,
  loading: {
    editor: false,
    terminal: false,
  } as TLoading,
  project_options: {} as TProjectOptions,
  layout: {
    layout: "layout_1",
  } as TLayout,
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers: {
    set_folder_structure: (state, action: PayloadAction<IFolderStructure>) => {
      state.folder_structure = action.payload;
    },
    update_active_files: (state, action: PayloadAction<TActiveFile[]>) => {
      state.active_files = action.payload;
    },
    update_simple_tabs: (state, action: PayloadAction<TSimpleTab[]>) => {
      state.simple_tabs = action.payload;
    },
    update_simple_tab: (state, action: PayloadAction<TSimpleTab>) => {
      state.simple_tab = action.payload;
    },
    update_active_file: (state, action: PayloadAction<TActiveFile>) => {
      state.active_file = action.payload;
    },
    update_indent: (state, action: PayloadAction<TIndent>) => {
      state.indent = action.payload;
    },
    update_panel_state: (state, action: PayloadAction<TPanelState>) => {
      state.panel_state = action.payload;
    },
    update_loading: (state, action: PayloadAction<TLoading>) => {
      state.loading = action.payload;
    },
    update_layout: (state, action: PayloadAction<TLayout>) => {
      state.layout = action.payload;
    },
    update_project_options: (state, action: PayloadAction<TProjectOptions>) => {
      state.project_options = action.payload;
    },
  },
});

export const {
  set_folder_structure,
  update_project_options,
  update_active_files,
  update_active_file,
  update_simple_tab,
  update_simple_tabs,
  update_panel_state,
  update_indent,
  update_loading,
  update_layout,
} = mainSlice.actions;

export default mainSlice.reducer;
