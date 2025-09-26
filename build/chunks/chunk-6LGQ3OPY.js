import {
  getStandalone,
  init_workbench_standalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.editor/workbench.editor.theme.ts
function registerTheme(_monaco) {
  _monaco.editor.defineTheme("meridia-theme", {
    base: _kind === "light" ? "vs" : "vs-dark",
    inherit: true,
    rules: [
      { token: "default", foreground: _tokens.default },
      { token: "keyword", foreground: _tokens.keyword },
      { token: "keyword.json", foreground: _tokens["keyword.json"] },
      {
        token: "keyword.typeModifier",
        foreground: _tokens["keyword.typeModifier"]
      },
      { token: "metadata", foreground: _tokens.metadata },
      { token: "number", foreground: _tokens.number },
      { token: "boolean", foreground: _tokens.boolean || "d19a66" },
      { token: "string", foreground: _tokens.string },
      { token: "string.binary", foreground: _tokens["string.binary"] },
      { token: "string.escape", foreground: _tokens["string.escape"] },
      {
        token: "string.escape.alternative",
        foreground: _tokens["string.escape.alternative"]
      },
      {
        token: "string.formatItem",
        foreground: _tokens["string.format.item"]
      },
      { token: "string.regexp", foreground: _tokens["string.regexp"] },
      { token: "identifier", foreground: _tokens.identifier },
      { token: "identifier.this", foreground: _tokens["identifier.this"] },
      {
        token: "identifier.constant",
        foreground: _tokens["identifier.constant"]
      },
      {
        token: "identifier.variable.local",
        foreground: _tokens["identifier.variable.local"]
      },
      {
        token: "identifier.parameter",
        foreground: _tokens["identifier.parameter"]
      },
      {
        token: "identifier.function.declaration",
        foreground: _tokens["identifier.function.declaration"]
      },
      {
        token: "identifier.method.static",
        foreground: _tokens["identifier.method.static"]
      },
      {
        token: "identifier.builtin",
        foreground: _tokens["identifier.builtin"]
      },
      { token: "identifier.type", foreground: _tokens["identifier.type"] },
      { token: "identifier.field", foreground: _tokens["identifier.field"] },
      {
        token: "identifier.field.static",
        foreground: _tokens["identifier.field.static"]
      },
      {
        token: "identifier.interface",
        foreground: _tokens["identifier.interface"]
      },
      {
        token: "identifier.type.class",
        foreground: _tokens["identifier.type.class"]
      },
      { token: "comment", foreground: _tokens.comment },
      {
        token: "comment.parameter",
        foreground: _tokens["comment.parameter"]
      },
      { token: "punctuation", foreground: _tokens.punctuation }
    ],
    colors: {
      "editor.background": _background,
      "editor.foreground": _foreground,
      "editorCursor.foreground": _cursor
    }
  });
}
var _theme, _kind, _background, _foreground, _cursor, _tokens;
var init_workbench_editor_theme = __esm({
  "src/code/workbench/common/workbench.editor/workbench.editor.theme.ts"() {
    init_workbench_standalone();
    _theme = getStandalone("theme");
    _kind = _theme.getActiveTheme().kind;
    _background = _theme.getColor("workbench.editor.background");
    _foreground = _theme.getColor("workbench.editor.foreground");
    _cursor = _theme.getColor("workbench.editor.cursor.foreground");
    _tokens = _theme.getActiveTheme().tokenColors;
  }
});

export {
  registerTheme,
  init_workbench_editor_theme
};
