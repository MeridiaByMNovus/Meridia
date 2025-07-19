import { shortcuts } from "./shortcuts";

export const commands = [
  {
    id: "new",
    label: "New File",
    shortcut: shortcuts.new_file,
  },
  {
    id: "open",
    label: "Open File",
    shortcut: shortcuts.open_file,
  },
  {
    id: "open-folder",
    label: "Open Folder",
    shortcut: shortcuts.open_folder,
  },
  {
    id: "save",
    label: "Save File",
    shortcut: shortcuts.save_file,
  },
  {
    id: "settings",
    label: "Settings",
    shortcut: shortcuts.settings,
  },
  {
    id: "meridia-studio",
    label: "Meridia Studio",
    shortcut: shortcuts.meridia_studio,
  },
  {
    id: "toggle-sidebar",
    label: "Toggle Sidebar",
    shortcut: shortcuts.toggle_left_panel,
  },
  {
    id: "toggle-right-panel",
    label: "Toggle Right Panel",
    shortcut: shortcuts.toggle_right_panel,
  },
  {
    id: "toggle-bottom-panel",
    label: "Toggle Bottom Panel",
    shortcut: shortcuts.toggle_bottom_panel,
  },
  {
    id: "open-output",
    label: "Open Output",
    shortcut: shortcuts.open_output,
  },
  {
    id: "open-terminal",
    label: "Open Terminal",
    shortcut: shortcuts.open_terminal,
  },
  {
    id: "run",
    label: "Run",
    shortcut: shortcuts["run"],
  },
];
