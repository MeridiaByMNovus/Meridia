import { IThemeColors, ThemeColors, ITokenColors } from "../workbench.types.js";

export const tokensToCssVariables: Record<IThemeColors, string> = {
  "workbench.background": "--workbench-background",
  "workbench.foreground": "--workbench-foreground",
  "workbench.border.foreground": "--workbench-border-foreground",
  "workbench.icon.foreground": "--workbench-icon-foreground",
  "workbench.primary.button.background":
    "--workbench-primary-button-background",
  "workbench.primary.button.foreground":
    "--workbench-primary-button-foreground",
  "workbench.secondary.button.background":
    "--workbench-secondary-button-background",
  "workbench.secondary.button.foreground":
    "--workbench-secondary-button-foreground",
  "workbench.button.border": "--workbench-button-border",
  "workbench.button.separator": "--workbench-button-separator",
  "workbench.secondary.button.border": "--workbench-secondary-button-border",
  "workbench.input.background": "--workbench-input-background",
  "workbench.input.foreground": "--workbench-input-foreground",
  "workbench.input.outline": "--workbench-input-border-foreground",
  "workbench.input.active.outline": "--workbench-input-active-outline",
  "workbench.input.icon.foreground": "--workbench-input-icon-foreground",
  "workbench.editor.background": "--workbench-editor-background",
  "workbench.editor.foreground": "--workbench-editor-foreground",
  "workbench.editor.cursor.foreground": "--workbench-editor-cursor-foreground",
  "workbench.editor.line.highlight.background":
    "--workbench-editor-line-highlight-background",
  "workbench.gemini.chatbox.active.border.foreground":
    "--workbench-gemini-chatbox-active-border-foreground",
  "workbench.gemini.chatbox.background":
    "--workbench-gemini-chatbox-background",
  "workbench.gemini.chatbox.border.foreground":
    "--workbench-gemini-chatbox-border-foreground",
  "workbench.gemini.chatbox.foreground":
    "--workbench-gemini-chatbox-foreground",
  "workbench.gemini.message.ai.background":
    "--workbench-gemini-message-ai-background",
  "workbench.gemini.message.ai.border.foreground":
    "--workbench-gemini-message-ai-border-foreground",
  "workbench.gemini.message.ai.foreground":
    "--workbench-gemini-message-ai-foreground",
  "workbench.gemini.message.user.background":
    "--workbench-gemini-message-user-background",
  "workbench.gemini.message.user.border.foreground":
    "--workbench-gemini-message-user-border-foreground",
  "workbench.gemini.message.user.foreground":
    "--workbench-gemini-message-user-foreground",
  "workbench.tabs.background": "--workbench-tabs-background",
  "workbench.tabs.foreground": "--workbench-tabs-foreground",
  "workbench.tabs.icon.foreground": "--workbench-tabs-icon-foreground",
  "workbench.tabs.hover.background": "--workbench-tabs-hover-background",
  "workbench.tabs.hover.foreground": "--workbench-tabs-hover-foreground",
  "workbench.tabs.active.background": "--workbench-tabs-active-background",
  "workbench.tabs.active.foreground": "--workbench-tabs-active-foreground",
  "workbench.tabs.active.border.foreground":
    "--workbench-tabs-active-border-foreground",
  "workbench.scrollbar.background": "--workbench-scrollbar-background",
  "workbench.scrollbar.thumb.foreground":
    "--workbench-scrollbar-thumb-foreground",
  "workbench.scrollbar.thumb.hover.foreground":
    "--workbench-scrollbar-thumb-hover-foreground",
  "workbench.scrollbar.thumb.active.foreground":
    "--workbench-scrollbar-thumb-active-foreground",
  "workbench.terminal.background": "--workbench-terminal-background",
  "workbench.terminal.foreground": "--workbench-terminal-foreground",
  "workbench.terminal.cursor.foreground":
    "--workbench-terminal-cursor-foreground",
  "workbench.panel.background": "--workbench-panel-background",
  "workbench.panel.options.hover.background":
    "--workbench-panel-options-hover-background",
  "workbench.panel.options.active.background":
    "--workbench-panel-options-active-background",
  "workbench.panel.options.active.border.foreground":
    "--workbench-panel-options-active-border-foreground",
  "workbench.dialog.background": "--workbench-dialog-background",
  "workbench.dialog.foreground": "--workbench-dialog-foreground",
  "workbench.dialog.hover.background": "--workbench-dialog-hover-background",
  "workbench.dialog.hover.foreground": "--workbench-dialog-hover-foreground",
  "workbench.item.hover.background": "--workbench-hover-background",
  "workbench.titlebar.background": "--workbench-titlebar-background",
  "workbench.titlebar.foreground": "--workbench-titlebar-foreground",
  "workbench.titlebar.item.hover.background":
    "--workbench-titlebar-item-hover-background",
  "workbench.titlebar.window.controls.circle.foreground":
    "--workbench-titlebar-window-controls-circle-foreground",
  "workbench.titlebar.search.background":
    "--workbench-titlebar-search-background",
  "workbench.titlebar.search.foreground":
    "--workbench-titlebar-search-foreground",
  "workbench.titlebar.search.hover.outline":
    "--workbench-titlebar-search-hover-outline",
  "workbench.titlebar.menu.background": "--workbench-titlebar-menu-background",
  "workbench.titlebar.menu.foreground": "--workbench-titlebar-menu-foreground",
  "workbench.titlebar.menu.item.hover.background":
    "--workbench-titlebar-menu-item-hover-background",
  "workbench.statusbar.foreground": "--workbench-statusbar-foreground",
  "workbench.statusbar.item.hover.background":
    "--workbench-statusbar-item-hover-background",
};

export function parseTokensToCssVariables(
  _colors: Partial<Record<IThemeColors, string>>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of ThemeColors) {
    const cssVar = tokensToCssVariables[key];
    const value = _colors[key];
    if (cssVar && value) result[cssVar] = value;
  }
  return result;
}

export function getIcon(_name: string) {
  const _ext = _name.split(".").pop() || "";

  const _supported = ["ts", "js", "py", "html", "json"];

  let _iconPath: string;

  if (_supported.includes(_ext)) {
    _iconPath = window.path.join([
      window.path.__dirname(),
      "..",
      "workbench",
      "browser",
      "workbench.media",
      "icons",
      `file.type.${_ext}.svg`,
    ]);
  } else {
    _iconPath = window.path.join([
      window.path.__dirname(),
      "..",
      "workbench",
      "browser",
      "workbench.media",
      "icons",
      `file.type.default.svg`,
    ]);
  }

  const _content = window.fs.readFile(_iconPath);

  return _content;
}

export function getLanguage(_path: string) {
  const extension = _path.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "py":
      return "python";
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
      return "css";
    case "md":
      return "markdown";
    case "xml":
      return "xml";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "plaintext";
  }
}

export function getRelativePath(basePath: string, targetPath: string): string {
  const normalizedBase = basePath.replace(/[/\\]+$/, "");
  const normalizedTarget = targetPath.replace(/[/\\]+$/, "");

  if (normalizedTarget.startsWith(normalizedBase)) {
    const relativePath = normalizedTarget.substring(normalizedBase.length);

    return relativePath.replace(/^[/\\]+/, "") || "./";
  }

  return targetPath;
}
