import {
  conf,
  init_typescript,
  language
} from "./chunk-DEMNTHCB.js";
import "./chunk-MNW4KTRE.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-languages/release/esm/javascript/javascript.js
var conf2, language2;
var init_javascript = __esm({
  "node_modules/monaco-languages/release/esm/javascript/javascript.js"() {
    init_typescript();
    conf2 = conf;
    language2 = {
      // Set defaultToken to invalid to see what you do not tokenize yet
      defaultToken: "invalid",
      tokenPostfix: ".js",
      keywords: [
        "break",
        "case",
        "catch",
        "class",
        "continue",
        "const",
        "constructor",
        "debugger",
        "default",
        "delete",
        "do",
        "else",
        "export",
        "extends",
        "false",
        "finally",
        "for",
        "from",
        "function",
        "get",
        "if",
        "import",
        "in",
        "instanceof",
        "let",
        "new",
        "null",
        "return",
        "set",
        "super",
        "switch",
        "symbol",
        "this",
        "throw",
        "true",
        "try",
        "typeof",
        "undefined",
        "var",
        "void",
        "while",
        "with",
        "yield",
        "async",
        "await",
        "of"
      ],
      typeKeywords: [],
      operators: language.operators,
      symbols: language.symbols,
      escapes: language.escapes,
      digits: language.digits,
      octaldigits: language.octaldigits,
      binarydigits: language.binarydigits,
      hexdigits: language.hexdigits,
      regexpctl: language.regexpctl,
      regexpesc: language.regexpesc,
      tokenizer: language.tokenizer
    };
  }
});
init_javascript();
export {
  conf2 as conf,
  language2 as language
};
