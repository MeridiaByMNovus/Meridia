import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-languages/release/esm/ini/ini.js
var conf, language;
var init_ini = __esm({
  "node_modules/monaco-languages/release/esm/ini/ini.js"() {
    conf = {
      comments: {
        lineComment: "#"
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    };
    language = {
      defaultToken: "",
      tokenPostfix: ".ini",
      // we include these common regular expressions
      escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
      // The main tokenizer for our languages
      tokenizer: {
        root: [
          // sections
          [/^\[[^\]]*\]/, "metatag"],
          // keys
          [/(^\w+)(\s*)(\=)/, ["key", "", "delimiter"]],
          // whitespace
          { include: "@whitespace" },
          // numbers
          [/\d+/, "number"],
          // strings: recover on non-terminated strings
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/"/, "string", '@string."'],
          [/'/, "string", "@string.'"]
        ],
        whitespace: [
          [/[ \t\r\n]+/, ""],
          [/^\s*[#;].*$/, "comment"]
        ],
        string: [
          [/[^\\"']+/, "string"],
          [/@escapes/, "string.escape"],
          [/\\./, "string.escape.invalid"],
          [
            /["']/,
            {
              cases: {
                "$#==$S2": { token: "string", next: "@pop" },
                "@default": "string"
              }
            }
          ]
        ]
      }
    };
  }
});
init_ini();
export {
  conf,
  language
};
