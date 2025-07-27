import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  IEditorTab,
  IFolderStructure,
  IMainState,
  ITab,
} from "../../../../typings/types.js";

const initialState: IMainState = {
  folder_structure: {} as IFolderStructure,
  editor_tabs: [] as IEditorTab[],
  editor_active_tab: {} as IEditorTab,
  terminal_tabs: [] as ITab[],
  terminal_active_tab: {} as ITab,
  active_sidebaritem: "",
};

export const mainSlice = createSlice({
  name: "main",
  initialState,
  reducers: {
    set_folder_structure: (state, action: PayloadAction<IFolderStructure>) => {
      state.folder_structure = action.payload;
    },
    update_editor_tabs: (state, action: PayloadAction<IEditorTab[]>) => {
      state.editor_tabs = action.payload;
    },
    update_editor_active_tab: (state, action: PayloadAction<IEditorTab>) => {
      state.editor_active_tab = action.payload;
    },
    update_terminal_tabs: (state, action: PayloadAction<ITab[]>) => {
      state.terminal_tabs = action.payload;
    },
    update_terminal_active_tab: (state, action: PayloadAction<ITab>) => {
      state.terminal_active_tab = action.payload;
    },
    update_active_sidebaritem: (state, action: PayloadAction<string>) => {
      state.active_sidebaritem = action.payload;
    },
  },
});

export const {
  set_folder_structure,
  update_editor_tabs,
  update_editor_active_tab,
  update_terminal_active_tab,
  update_terminal_tabs,
  update_active_sidebaritem,
} = mainSlice.actions;

export default mainSlice.reducer;
