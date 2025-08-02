import { KnownColorKey, knownColorKeys } from "../../../typings/types";

export const get_file_types = (file_name: string) => {
  const fileTypes = {
    ".gitignore": "ignore",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".json": "json",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".go": "go",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kotlin": "kotlin",
    ".dart": "dart",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".xls": "excel",
    ".xlsx": "excel",
    ".csv": "csv",
  };
  return fileTypes[
    Object.keys(fileTypes).filter((type) =>
      new RegExp(`${type}$`).test(file_name)
    )[0] as keyof typeof fileTypes
  ];
};

export const tokensToCssVariables: Record<KnownColorKey, string> = {
  "workbench.background": "--main-bg",
  "workbench.foreground": "--text-color",
  "editor.background": "--editor-bg",
  "editor.foreground": "--text-color",
  "editor.lineHighlightBackground": "--line-highlight-bg",
  "cursor.foreground": "--cursor-color",
  "activityBar.background": "--activity-bar-bg",
  "activityBar.foreground": "--activity-bar-text",

  "titleBar.activeBackground": "--titlebar-bg",
  "statusBar.background": "--status-bar-bg",
  "extensionViewlet.background": "--extension-bg",
  "activityBarContent.background": "--content-bg",
  "quickInput.background": "--command-palette-bg",
  "tab.inactiveBackground": "--tab-bg",
  "tab.activeBackground": "--tab-active-bg",
  "tab.containerBackground": "--tabs-wrapper-bg",
  "tab.activeBorder": "--active-border",
  "tab.activeForeground": "--tab-active-text-color",
  "tab.inactiveForeground": "--tab-text-color",
  "button.foreground": "--active-icon-color",
  "settings.editor.background": "--settings-bg",
  "settings.activityBar.background": "--settings-activityBar-bg",
  "terminal.background": "--terminal-bg",
  "terminal.tab.activeBorder": "--tab-active-border",
  "input.background": "--input-bg",
  "dropdown.background": "--dropdown-bg",
  "editorHoverWidget.background": "--tooltip-bg",
  "border.foreground": "--border-color",
  focusBorder: "--focus-color",
  foreground: "--text-color",
  descriptionForeground: "--second-text-color",
  "workbench.icon.foreground": "--icon-color",
  "workbench.hoverBackground": "--hover-bg",
  "titleBar.activeBorder": "--titlebar-border",
  "menu.background": "--submenu-bg",
  "menu.separatorBackground": "--separator",
  "tree.indentGuidesStroke": "--file-tree-folder-content-border-color",
  "scrollbarSlider.background": "--scrollbar-thumb-color",
  "scrollbarSlider.hoverBackground": "--hover-scrollbar-color",
  "scrollbar.shadow": "--scrollbar-color",
  "scrollbarSlider.activeBackground": "--active-scrollbar-color",
  "splitView.dragAndDropBackground": "--splitter-active-color",
  "splitView.inactiveBackground": "--splitter-color",
  "explorer.foreground": "--file-tree-foreground",
  "explorer.icon.foreground": "--file-tree-icon-foreground",
  "explorer.icon.activeforeground": "--file-tree-icon-active-foreground",
  "explorer.text.activeforeground": "--file-tree-text-active-foreground",
  "explorer.activebackground": "--file-tree-active-background",
  "explorer.hoverbackground": "--file-tree-hover-background",
  "explorer.input.activeborder": "--file-tree-active-border",
  "explorer.input.border": "--file-tree-border",
  "titleBar.border": "--titlebar-border",
  "textLink.foreground": "--blue-color",
  "charts.green": "--green-color",
  "charts.red": "--red-color",
};

export function parseTokensToCssVariables(
  colors: Partial<Record<KnownColorKey, string>>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of knownColorKeys) {
    const cssVar = tokensToCssVariables[key];
    const value = colors[key];
    if (cssVar && value) result[cssVar] = value;
  }
  return result;
}
