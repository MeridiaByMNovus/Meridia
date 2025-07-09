import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  IFolderStructure,
  IMainState,
  TActiveFile,
  TIndent,
  TLayout,
  TSimpleTab,
} from "./types";

const initialState: IMainState = {
  folder_structure: {} as IFolderStructure,
  active_files: [],
  active_file: {} as TActiveFile,
  simple_tabs: [],
  simple_tab: {} as TSimpleTab,
  indent: { column: 0, line: 0 } as TIndent,
  layout: {
    right_panel: false,
    bottom_panel: false,
    sidebar: false,
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
    update_layout: (state, action: PayloadAction<TLayout>) => {
      state.layout = action.payload;
    },
  },
});

export const {
  set_folder_structure,
  update_active_files,
  update_active_file,
  update_simple_tab,
  update_simple_tabs,
  update_indent,
  update_layout,
} = mainSlice.actions;

export default mainSlice.reducer;
