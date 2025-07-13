import { ipcMain, Menu, MenuItem } from "electron";
import {
  handleNewFile,
  handleNewProject,
  handleOpenBottomPanel,
  handleOpenCommandPalette,
  handleOpenFile,
  handleOpenFolder,
  handleOpenRightPanel,
  handleOpenSettings,
  handleOpenSidebar,
  handleOpenTerminal,
  handleRun,
  handleSaveCurrentFile,
} from "./functions_worker";

import { shortcuts } from "../../src/ui/data/shortcuts";

export function RegisterMenu() {
  const MenuTemplate = [
    {
      label: "File",
      submenu: [
        { label: "New Text File" },
        {
          label: "New File",
          accelerator: shortcuts.new_file,
          click: handleNewFile,
        },
        { type: "separator" },
        {
          label: "Open...",
          accelerator: shortcuts.open_file,
          click: handleOpenFile,
        },
        {
          label: "Open Folder...",
          accelerator: shortcuts.open_folder,
          click: () => handleOpenFolder(),
        },
        { type: "separator" },
        {
          label: "New Project",
          accelerator: shortcuts.new_project,
          click: handleNewProject,
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: shortcuts.save_file,
          click: handleSaveCurrentFile,
        },
        { label: "Save As..." },
        { type: "separator" },
        { type: "separator" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Selection",
      submenu: [
        { role: "selectAll" },
        { label: "Expand Selection" },
        { label: "Shrink Selection" },
        { type: "separator" },
        { label: "Copy Line Up" },
        { label: "Copy Line Down" },
        { label: "Move Line Up" },
        { label: "Move Line Down" },
        { label: "Duplicate Selection" },
        { type: "separator" },
        { label: "Add Cursor Above" },
        { label: "Add Cursor Below" },
        { label: "Add Cursor to Line Ends" },
        { label: "Add Next Occurrence" },
        { label: "Add Previous Occurrence" },
        { label: "Select All Occurrence" },
        { type: "separator" },
        { label: "Column Selection Mode" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Command Palette",
          accelerator: shortcuts.command_palette,
          click: handleOpenCommandPalette,
        },
        { label: "Open View" },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: shortcuts.settings,
          click: handleOpenSettings,
        },
        { type: "separator" },
        {
          label: "Toggle Left Panel",
          accelerator: shortcuts.toggle_left_panel,
          click: handleOpenSidebar,
        },
        {
          label: "Toggle Right Panel",
          accelerator: shortcuts.toggle_right_panel,
          click: handleOpenRightPanel,
        },
        {
          label: "Toggle Bottom Panel",
          accelerator: shortcuts.toggle_bottom_panel,
          click: handleOpenBottomPanel,
        },
        {
          label: "Terminal",
          accelerator: shortcuts.open_terminal,
          click: handleOpenTerminal,
        },
      ],
    },
    {
      label: "Run",
      submenu: [
        {
          label: "Run",
          click: handleRun,
          accelerator: shortcuts.run,
        },
        { label: "Start Debugging" },
        { label: "Run Without Debugging" },
        { label: "Stop Debugging", enabled: false },
        { label: "Restart Debugging", enabled: false },
        { type: "separator" },
        { label: "Open Configuration", enabled: false },
        { label: "Add Configuration", enabled: true },
        { type: "separator" },
        { label: "Step Over", enabled: false },
        { label: "Step Into", enabled: false },
        { label: "Step Out", enabled: false },
        { label: "Continue", enabled: false },
        { type: "separator" },
        { label: "Toggle Breakpoint" },
        { label: "New Breakpoint" },
        {
          role: "zoom",
          submenu: [
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
          ],
        },
      ],
    },
  ] as unknown as MenuItem[];

  const menu = Menu.buildFromTemplate(MenuTemplate);
  Menu.setApplicationMenu(menu);

  ipcMain.handle("get-menu", () => {
    const menu = Menu.getApplicationMenu();
    return menu?.items.map((item, index) => ({
      id: `menu-${index}`,
      label: item.label,
      accelerator: item.accelerator || item.role || "",
      type: item.type || "",
      submenu: item.submenu?.items.map((sub, subIndex) => ({
        id: `menu-${index}-sub-${subIndex}`,
        label: sub.label,
        accelerator: sub.accelerator || "",
      })),
    }));
  });

  ipcMain.on("menu-click", (event, menuId) => {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    menu.items.forEach((item, index) => {
      if (`menu-${index}` === menuId && item.click) {
        item.click();
      }
      if (item.submenu) {
        item.submenu.items.forEach((sub, subIndex) => {
          if (`menu-${index}-sub-${subIndex}` === menuId && sub.click) {
            sub.click();
          }
        });
      }
    });
  });
}
