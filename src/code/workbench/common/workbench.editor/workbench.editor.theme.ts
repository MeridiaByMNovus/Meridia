import monaco from "monaco-editor";
import { getStandalone } from "../workbench.standalone.js";
import { Theme } from "../workbench.theme.js";

const _theme = getStandalone("theme") as Theme;
const _kind = _theme.getActiveTheme().kind;
const _background = _theme.getColor("workbench.editor.background");
const _foreground = _theme.getColor("workbench.editor.foreground");
const _cursor = _theme.getColor("workbench.editor.cursor.foreground");
const _lineHighlight = _theme.getColor(
  "workbench.editor.line.highlight.background"
);
const _tokens = _theme.getActiveTheme().tokenColors!;

export function registerTheme(_monaco: any) {
  _monaco.editor.defineTheme("meridia-theme", {
    base: _kind === "light" ? "vs" : "vs-dark",
    inherit: true,
    rules: [
      { token: "default", foreground: _tokens.default },
      { token: "keyword", foreground: _tokens.keyword },
      { token: "keyword.json", foreground: _tokens["keyword.json"] },
      {
        token: "keyword.typeModifier",
        foreground: _tokens["keyword.typeModifier"],
      },
      { token: "metadata", foreground: _tokens.metadata },
      { token: "number", foreground: _tokens.number },
      { token: "boolean", foreground: _tokens.boolean || "d19a66" },
      { token: "string", foreground: _tokens.string },
      { token: "string.binary", foreground: _tokens["string.binary"] },
      { token: "string.escape", foreground: _tokens["string.escape"] },
      {
        token: "string.escape.alternative",
        foreground: _tokens["string.escape.alternative"],
      },
      {
        token: "string.formatItem",
        foreground: _tokens["string.format.item"],
      },
      { token: "string.regexp", foreground: _tokens["string.regexp"] },
      { token: "identifier", foreground: _tokens.identifier },
      { token: "identifier.this", foreground: _tokens["identifier.this"] },
      {
        token: "identifier.constant",
        foreground: _tokens["identifier.constant"],
      },
      {
        token: "identifier.variable.local",
        foreground: _tokens["identifier.variable.local"],
      },
      {
        token: "identifier.parameter",
        foreground: _tokens["identifier.parameter"],
      },
      {
        token: "identifier.function.declaration",
        foreground: _tokens["identifier.function.declaration"],
      },
      {
        token: "identifier.method.static",
        foreground: _tokens["identifier.method.static"],
      },
      {
        token: "identifier.builtin",
        foreground: _tokens["identifier.builtin"],
      },
      { token: "identifier.type", foreground: _tokens["identifier.type"] },
      { token: "identifier.field", foreground: _tokens["identifier.field"] },
      {
        token: "identifier.field.static",
        foreground: _tokens["identifier.field.static"],
      },
      {
        token: "identifier.interface",
        foreground: _tokens["identifier.interface"],
      },
      {
        token: "identifier.type.class",
        foreground: _tokens["identifier.type.class"],
      },
      { token: "comment", foreground: _tokens.comment },
      {
        token: "comment.parameter",
        foreground: _tokens["comment.parameter"],
      },
      { token: "punctuation", foreground: _tokens.punctuation },
    ],
    colors: {
      "editor.background": _background,
      "editor.foreground": _foreground,
      "editorCursor.foreground": _cursor,
      "editor.lineHighlightBorder": _background,
      "editor.lineHighlightBackground": _lineHighlight,
    },
  } as monaco.editor.IStandaloneThemeData);
}
