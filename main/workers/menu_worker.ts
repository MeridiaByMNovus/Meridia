import { ipcMain, Menu, MenuItem } from "electron";
import {
  handleNewFile,
  handleNewProject,
  handleOpenBottomPanel,
  handleOpenCommandPalette,
  handleOpenFile,
  handleOpenFolder,
  handleOpenMeridiaStudio,
  handleOpenOutput,
  handleOpenRightPanel,
  handleOpenSettings,
  handleOpenSidebar,
  handleOpenTerminal,
  handleRun,
  handleSaveCurrentFile,
} from "./functions_worker";

export function RegisterMenu() {
  const MenuTemplate = [
    {
      label: "File",
      submenu: [
        { label: "New Text File" },
        {
          label: "New File",
          accelerator: "Ctrl+N",
          click: handleNewFile,
        },
        { type: "separator" },
        {
          label: "Open...",
          accelerator: "Ctrl+O",
          click: handleOpenFile,
        },
        {
          label: "Open Folder...",
          accelerator: "Ctrl+Shift+O",
          click: () => handleOpenFolder(),
        },
        { type: "separator" },
        {
          label: "New Project",
          accelerator: "Ctrl+Shift+N",
          click: handleNewProject,
        },
        { type: "separator" },
        {
          label: "Save",
          accelerator: "Ctrl + S",
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
          accelerator: "Ctrl + Shift + P",
          click: handleOpenCommandPalette,
        },
        { label: "Open View" },
        { type: "separator" },
        {
          label: "Settings",
          accelerator: "Ctrl + ,",
          click: handleOpenSettings,
        },
        {
          label: "Meridia Studio",
          accelerator: "Ctrl + Shift + B",
          click: handleOpenMeridiaStudio,
        },
        { type: "separator" },
        {
          label: "Sidebar",
          accelerator: "Ctrl + B",
          click: handleOpenSidebar,
        },
        {
          label: "Right Panel",
          accelerator: "Ctrl + Alt + B",
          click: handleOpenRightPanel,
        },
        {
          label: "Bottom Panel",
          accelerator: "Ctrl + J",
          click: handleOpenBottomPanel,
        },
        {
          label: "Output",
          accelerator: "Ctrl + K",
          click: handleOpenOutput,
        },
        {
          label: "Terminal",
          accelerator: "Ctrl + `",
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
          accelerator: "F12",
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
