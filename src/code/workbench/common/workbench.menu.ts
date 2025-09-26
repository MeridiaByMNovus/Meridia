import { DropdownItem } from "../workbench.types.js";

export const menuItems: DropdownItem[] = [
  {
    label: "File",
    submenu: [
      {
        label: "New",
        submenu: [
          {
            label: "Python File",
            action: "new_python_file",
          },
          {
            label: "JavaScript File",
            action: "new_js_file",
          },
          {
            label: "HTML File",
            action: "new_html_file",
          },
          {
            label: "CSS File",
            action: "new_css_file",
          },
          {
            label: "",
            separator: true,
          },
          {
            label: "Folder",
            action: "new_folder",
          },
        ],
      },
      {
        label: "Open",
        submenu: [
          {
            label: "Open File...",
            action: "open_file",
          },
          {
            label: "Open Folder...",
            action: "open_folder",
          },
          {
            label: "Open Workspace...",
            action: "open_workspace",
          },
          {
            label: "",
            separator: true,
          },
          {
            label: "Open Recent",
            submenu: [
              {
                label: "project-1",
                action: "open_recent:project-1",
              },
              {
                label: "main.py",
                action: "open_recent:main.py",
              },
              {
                label: "index.html",
                action: "open_recent:index.html",
              },
              {
                label: "",
                separator: true,
              },
              {
                label: "Clear Recent Files",
                action: "clear_recent",
              },
            ],
          },
        ],
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Save",
        action: "save",
      },
      {
        label: "Save As...",
        action: "save_as",
      },
      {
        label: "Save All",
        action: "save_all",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Close File",
        action: "close_file",
      },
      {
        label: "Close All Files",
        action: "close_all_files",
      },
    ],
  },
  {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        action: "undo",
      },
      {
        label: "Redo",
        action: "redo",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Cut",
        action: "cut",
      },
      {
        label: "Copy",
        action: "copy",
      },
      {
        label: "Paste",
        action: "paste",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Select All",
        action: "select_all",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Find",
        submenu: [
          {
            label: "Find...",
            action: "find",
          },
          {
            label: "Find and Replace...",
            action: "find_replace",
          },
          {
            label: "Find in Files...",
            action: "find_in_files",
          },
          {
            label: "Find Next",
            action: "find_next",
          },
          {
            label: "Find Previous",
            action: "find_previous",
          },
        ],
      },
    ],
  },
  {
    label: "View",
    submenu: [
      {
        label: "Panels",
        submenu: [
          {
            label: "Toggle Left Panel",
            action: "toggle_left_panel",
          },
          {
            label: "Toggle Right Panel",
            action: "toggle_right_panel",
          },
          {
            label: "Toggle Bottom Panel",
            action: "toggle_bottom_panel",
          },
          {
            label: "",
            separator: true,
          },
          {
            label: "Show Explorer",
            action: "show_explorer",
          },
          {
            label: "Show Terminal",
            action: "show_terminal",
          },
          {
            label: "Show Output",
            action: "show_output",
          },
        ],
      },
      {
        label: "Editor",
        submenu: [
          {
            label: "Split Editor Right",
            action: "split_editor_right",
          },
          {
            label: "Split Editor Down",
            action: "split_editor_down",
          },
          {
            label: "",
            separator: true,
          },
          {
            label: "Toggle Word Wrap",
            action: "toggle_word_wrap",
          },
          {
            label: "Toggle Minimap",
            action: "toggle_minimap",
          },
        ],
      },
      {
        label: "Zoom",
        submenu: [
          {
            label: "Zoom In",
            action: "zoom_in",
          },
          {
            label: "Zoom Out",
            action: "zoom_out",
          },
          {
            label: "Reset Zoom",
            action: "reset_zoom",
          },
        ],
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Toggle Fullscreen",
        action: "toggle_fullscreen",
      },
      {
        label: "Toggle Zen Mode",
        action: "toggle_zen_mode",
      },
    ],
  },
  {
    label: "Run",
    submenu: [
      {
        label: "Run File",
        action: "run_file",
      },
      {
        label: "Run in Terminal",
        action: "run_in_terminal",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Debug File",
        action: "debug_file",
      },
      {
        label: "Start Debugging",
        action: "start_debugging",
      },
      {
        label: "Stop Debugging",
        action: "stop_debugging",
      },
    ],
  },
  {
    label: "",
    separator: true,
  },
  {
    label: "Tools",
    submenu: [
      {
        label: "Terminal",
        action: "open_terminal",
      },
      {
        label: "Command Palette",
        action: "command_palette",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Extensions",
        action: "extensions",
      },
      {
        label: "Themes",
        submenu: [
          {
            label: "Dark Theme",
            action: "theme_dark",
          },
          {
            label: "Light Theme",
            action: "theme_light",
          },
          {
            label: "High Contrast",
            action: "theme_high_contrast",
          },
        ],
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Settings",
        action: "settings",
      },
      {
        label: "Keyboard Shortcuts",
        action: "keyboard_shortcuts",
      },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "Documentation",
        action: "documentation",
      },
      {
        label: "Getting Started",
        action: "getting_started",
      },
      {
        label: "Keyboard Shortcuts",
        action: "keyboard_shortcuts",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "Report Issue",
        action: "report_issue",
      },
      {
        label: "Check for Updates",
        action: "check_updates",
      },
      {
        label: "",
        separator: true,
      },
      {
        label: "About Meridia",
        action: "about",
      },
    ],
  },
];
