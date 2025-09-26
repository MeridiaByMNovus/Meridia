import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-languages/release/esm/bicep/bicep.js
var bounded, identifierStart, identifierContinue, identifier, keywords, namedLiterals, nonCommentWs, numericLiteral, conf, language;
var init_bicep = __esm({
  "node_modules/monaco-languages/release/esm/bicep/bicep.js"() {
    bounded = function(text) {
      return "\\b" + text + "\\b";
    };
    identifierStart = "[_a-zA-Z]";
    identifierContinue = "[_a-zA-Z0-9]";
    identifier = bounded("" + identifierStart + identifierContinue + "*");
    keywords = [
      "targetScope",
      "resource",
      "module",
      "param",
      "var",
      "output",
      "for",
      "in",
      "if",
      "existing"
    ];
    namedLiterals = ["true", "false", "null"];
    nonCommentWs = "[ \\t\\r\\n]";
    numericLiteral = "[0-9]+";
    conf = {
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"]
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "'", close: "'" },
        { open: "'''", close: "'''" }
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "'", close: "'", notIn: ["string", "comment"] },
        { open: "'''", close: "'''", notIn: ["string", "comment"] }
      ],
      autoCloseBefore: ":.,=}])' \n	",
      indentationRules: {
        increaseIndentPattern: new RegExp("^((?!\\/\\/).)*(\\{[^}\"'`]*|\\([^)\"'`]*|\\[[^\\]\"'`]*)$"),
        decreaseIndentPattern: new RegExp("^((?!.*?\\/\\*).*\\*/)?\\s*[\\}\\]].*$")
      }
    };
    language = {
      defaultToken: "",
      tokenPostfix: ".bicep",
      brackets: [
        { open: "{", close: "}", token: "delimiter.curly" },
        { open: "[", close: "]", token: "delimiter.square" },
        { open: "(", close: ")", token: "delimiter.parenthesis" }
      ],
      symbols: /[=><!~?:&|+\-*/^%]+/,
      keywords,
      namedLiterals,
      escapes: "\\\\(u{[0-9A-Fa-f]+}|n|r|t|\\\\|'|\\${)",
      tokenizer: {
        root: [{ include: "@expression" }, { include: "@whitespace" }],
        stringVerbatim: [
          { regex: "(|'|'')[^']", action: { token: "string" } },
          { regex: "'''", action: { token: "string.quote", next: "@pop" } }
        ],
        stringLiteral: [
          { regex: "\\${", action: { token: "delimiter.bracket", next: "@bracketCounting" } },
          { regex: "[^\\\\'$]+", action: { token: "string" } },
          { regex: "@escapes", action: { token: "string.escape" } },
          { regex: "\\\\.", action: { token: "string.escape.invalid" } },
          { regex: "'", action: { token: "string", next: "@pop" } }
        ],
        bracketCounting: [
          { regex: "{", action: { token: "delimiter.bracket", next: "@bracketCounting" } },
          { regex: "}", action: { token: "delimiter.bracket", next: "@pop" } },
          { include: "expression" }
        ],
        comment: [
          { regex: "[^\\*]+", action: { token: "comment" } },
          { regex: "\\*\\/", action: { token: "comment", next: "@pop" } },
          { regex: "[\\/*]", action: { token: "comment" } }
        ],
        whitespace: [
          { regex: nonCommentWs },
          { regex: "\\/\\*", action: { token: "comment", next: "@comment" } },
          { regex: "\\/\\/.*$", action: { token: "comment" } }
        ],
        expression: [
          { regex: "'''", action: { token: "string.quote", next: "@stringVerbatim" } },
          { regex: "'", action: { token: "string.quote", next: "@stringLiteral" } },
          { regex: numericLiteral, action: { token: "number" } },
          {
            regex: identifier,
            action: {
              cases: {
                "@keywords": { token: "keyword" },
                "@namedLiterals": { token: "keyword" },
                "@default": { token: "identifier" }
              }
            }
          }
        ]
      }
    };
  }
});
init_bicep();
export {
  conf,
  language
};
