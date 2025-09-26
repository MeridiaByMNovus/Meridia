import {
  Dark,
  Light,
  init_platform_themes
} from "./chunk-IDBLEUYG.js";
import {
  init_workbench_utils,
  tokensToCssVariables
} from "./chunk-XIEV3R25.js";
import {
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.theme.ts
var Theme, _theme;
var init_workbench_theme = __esm({
  "src/code/workbench/common/workbench.theme.ts"() {
    init_platform_themes();
    init_workbench_standalone();
    init_workbench_utils();
    Theme = class {
      _active;
      registeredThemes = /* @__PURE__ */ new Map();
      constructor() {
        this.registerTheme(Dark);
        this.registerTheme(Light);
        this.setTheme("Dark");
      }
      getColor(_token) {
        const _key = tokensToCssVariables[_token];
        const _root = document.documentElement;
        const _value = getComputedStyle(_root).getPropertyValue(_key).trim();
        return _value;
      }
      registerTheme(_theme2) {
        this.registeredThemes.set(_theme2.name, _theme2);
      }
      getActiveTheme() {
        return this._active;
      }
      setTheme(_themeName) {
        const _theme2 = this.registeredThemes.get(_themeName);
        if (!_theme2?.colors) return;
        const _root = document.documentElement;
        for (const [key, value] of Object.entries(_theme2.colors)) {
          if (!value) continue;
          const varKey = tokensToCssVariables[key];
          if (varKey) _root.style.setProperty(varKey, value);
        }
        if (_theme2.tokenColors) {
          this._setTokenColors(_theme2.tokenColors);
        }
        this._active = _theme2;
      }
      _setTokenColors(tokenColors) {
        if (!tokenColors) return;
        const _root = document.documentElement;
        const tokenMapping = {
          "--token-default": tokenColors.default,
          "--token-keyword": tokenColors.keyword,
          "--token-keyword-json": tokenColors["keyword.json"],
          "--token-keyword-type-modifier": tokenColors["keyword.typeModifier"],
          "--token-metadata": tokenColors.metadata,
          "--token-number": tokenColors.number,
          "--token-boolean": tokenColors.boolean,
          "--token-string": tokenColors.string,
          "--token-string-binary": tokenColors["string.binary"],
          "--token-string-escape": tokenColors["string.escape"],
          "--token-string-escape-alternative": tokenColors["string.escape.alternative"],
          "--token-string-format-item": tokenColors["string.format.item"],
          "--token-string-regexp": tokenColors["string.regexp"],
          "--token-identifier": tokenColors.identifier,
          "--token-identifier-this": tokenColors["identifier.this"],
          "--token-identifier-constant": tokenColors["identifier.constant"],
          "--token-identifier-variable-local": tokenColors["identifier.variable.local"],
          "--token-identifier-parameter": tokenColors["identifier.parameter"],
          "--token-identifier-function-declaration": tokenColors["identifier.function.declaration"],
          "--token-identifier-method-static": tokenColors["identifier.method.static"],
          "--token-identifier-builtin": tokenColors["identifier.builtin"],
          "--token-identifier-type": tokenColors["identifier.type"],
          "--token-identifier-field": tokenColors["identifier.field"],
          "--token-identifier-field-static": tokenColors["identifier.field.static"],
          "--token-identifier-interface": tokenColors["identifier.interface"],
          "--token-identifier-type-class": tokenColors["identifier.type.class"],
          "--token-comment": tokenColors.comment,
          "--token-comment-parameter": tokenColors["comment.parameter"],
          "--token-punctuation": tokenColors.punctuation
        };
        for (const [variable, color] of Object.entries({
          ...tokenMapping
        })) {
          if (color) {
            _root.style.setProperty(variable, color);
          }
        }
      }
    };
    _theme = new Theme();
    registerStandalone("theme", _theme);
  }
});

export {
  Theme,
  _theme,
  init_workbench_theme
};
