import PerfectScrollbar from "perfect-scrollbar";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";

export interface ITheme {
  name: string;
  kind: "light" | "dark";
  colors: Partial<Record<IThemeColors, string>>;
  tokenColors?: Partial<Record<ITokenColors, string>>;
}

export const TokenColors = [
  "default",
  "keyword",
  "keyword.json",
  "keyword.typeModifier",
  "metadata",
  "number",
  "boolean",
  "string",
  "string.binary",
  "string.escape",
  "string.escape.alternative",
  "string.format.item",
  "string.regexp",
  "identifier",
  "identifier.this",
  "identifier.constant",
  "identifier.variable.local",
  "identifier.parameter",
  "identifier.function.declaration",
  "identifier.method.static",
  "identifier.builtin",
  "identifier.type",
  "identifier.field",
  "identifier.field.static",
  "identifier.interface",
  "identifier.type.class",
  "comment",
  "comment.parameter",
  "punctuation",
];

export const ThemeColors = [
  "workbench.background",
  "workbench.foreground",
  "workbench.border.foreground",
  "workbench.icon.foreground",
  "workbench.item.hover.background",
  "workbench.primary.button.background",
  "workbench.primary.button.foreground",
  "workbench.secondary.button.background",
  "workbench.secondary.button.foreground",
  "workbench.button.border",
  "workbench.button.separator",
  "workbench.secondary.button.border",
  "workbench.input.background",
  "workbench.input.foreground",
  "workbench.input.outline",
  "workbench.input.active.outline",
  "workbench.input.icon.foreground",
  "workbench.tabs.background",
  "workbench.tabs.foreground",
  "workbench.tabs.icon.foreground",
  "workbench.tabs.hover.background",
  "workbench.tabs.hover.foreground",
  "workbench.tabs.active.background",
  "workbench.tabs.active.foreground",
  "workbench.tabs.active.border.foreground",
  "workbench.scrollbar.background",
  "workbench.scrollbar.thumb.foreground",
  "workbench.scrollbar.thumb.hover.foreground",
  "workbench.scrollbar.thumb.active.foreground",
  "workbench.dialog.background",
  "workbench.dialog.foreground",
  "workbench.dialog.hover.background",
  "workbench.dialog.hover.foreground",
  "workbench.panel.background",
  "workbench.panel.options.hover.background",
  "workbench.panel.options.active.background",
  "workbench.panel.options.active.border.foreground",
  "workbench.titlebar.background",
  "workbench.titlebar.foreground",
  "workbench.titlebar.item.hover.background",
  "workbench.titlebar.window.controls.circle.foreground",
  "workbench.titlebar.search.background",
  "workbench.titlebar.search.foreground",
  "workbench.titlebar.search.hover.outline",
  "workbench.titlebar.menu.background",
  "workbench.titlebar.menu.foreground",
  "workbench.titlebar.menu.item.hover.background",
  "workbench.editor.background",
  "workbench.editor.foreground",
  "workbench.editor.cursor.foreground",
  "workbench.editor.line.highlight.background",
  "workbench.mira.message.user.background",
  "workbench.mira.message.user.foreground",
  "workbench.mira.message.user.border.foreground",
  "workbench.mira.message.ai.background",
  "workbench.mira.message.ai.foreground",
  "workbench.mira.message.ai.border.foreground",
  "workbench.mira.chatbox.background",
  "workbench.mira.chatbox.foreground",
  "workbench.mira.chatbox.border.foreground",
  "workbench.mira.chatbox.active.border.foreground",
  "workbench.mira.voice.color.violet",
  "workbench.mira.voice.color.orange",
  "workbench.mira.voice.color.white",
  "workbench.mira.voice.color.black",
  "workbench.mira.voice.caption.active.background",
  "workbench.terminal.background",
  "workbench.terminal.foreground",
  "workbench.terminal.cursor.foreground",
  "workbench.statusbar.foreground",
  "workbench.statusbar.item.hover.background",
] as const;

export type IThemeColors = (typeof ThemeColors)[number];
export type ITokenColors = (typeof TokenColors)[number];

export type TSplitterDirection = "horizontal" | "vertical";

export type TDragState = {
  startPos: number;
  prevPanelIndex: number;
  nextPanelIndex: number;
  prevPanelSize: number;
  nextPanelSize: number;
  direction: TSplitterDirection;
};

export interface DropdownItem {
  label: string;
  action?: string;
  separator?: boolean;
  submenu?: DropdownItem[];
  disabled?: boolean;
}

export interface IEditorTab {
  name: string;
  icon?: string;
  uri: string;
  is_touched: boolean;
  active: boolean;
}

export interface IDevTab {
  id: string;
  name: string;
  active: boolean;
  icon?: string;
}

export interface IDevPanelTab {
  id: string;
  name: string;
  active: boolean;
  cwd: string;
  pid?: number;
}

export interface IXTermInstance {
  term: XTerm;
  _container: HTMLElement;
  _fitAddon: FitAddon;
  _ptyDataListener: Function;
}

export interface IMainState {
  editor_tabs: IEditorTab[];
  panel_state: IPanelState;
  folder_structure: IFolderStructure;
}

export interface IPanelState {
  left: boolean;
  bottom: boolean;
  right: boolean;
}

export interface IFolderStructure {
  name: string;
  uri: string;
  type: "folder" | "file";
  isRoot: boolean;
  children: IFolderStructure[];
}

export interface IChatMessage {
  id: string;
  content: string;
  isUser: boolean;
}

export interface IMiraResponse {
  response: string;
  error?: string;
}
