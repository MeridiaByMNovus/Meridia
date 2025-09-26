import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-editor/esm/vs/basic-languages/azcli/azcli.js
var conf, language;
var init_azcli = __esm({
  "node_modules/monaco-editor/esm/vs/basic-languages/azcli/azcli.js"() {
    conf = {
      comments: {
        lineComment: "#"
      }
    };
    language = {
      defaultToken: "keyword",
      ignoreCase: true,
      tokenPostfix: ".azcli",
      str: /[^#\s]/,
      tokenizer: {
        root: [
          { include: "@comment" },
          [
            /\s-+@str*\s*/,
            {
              cases: {
                "@eos": { token: "key.identifier", next: "@popall" },
                "@default": { token: "key.identifier", next: "@type" }
              }
            }
          ],
          [
            /^-+@str*\s*/,
            {
              cases: {
                "@eos": { token: "key.identifier", next: "@popall" },
                "@default": { token: "key.identifier", next: "@type" }
              }
            }
          ]
        ],
        type: [
          { include: "@comment" },
          [
            /-+@str*\s*/,
            {
              cases: {
                "@eos": { token: "key.identifier", next: "@popall" },
                "@default": "key.identifier"
              }
            }
          ],
          [
            /@str+\s*/,
            {
              cases: {
                "@eos": { token: "string", next: "@popall" },
                "@default": "string"
              }
            }
          ]
        ],
        comment: [
          [
            /#.*$/,
            {
              cases: {
                "@eos": { token: "comment", next: "@popall" }
              }
            }
          ]
        ]
      }
    };
  }
});
init_azcli();
export {
  conf,
  language
};
