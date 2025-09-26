import {
  init_monaco_editor_core,
  languages
} from "./chunk-MNW4KTRE.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// node_modules/monaco-languages/release/esm/html/html.js
var EMPTY_ELEMENTS, conf, language;
var init_html = __esm({
  "node_modules/monaco-languages/release/esm/html/html.js"() {
    init_monaco_editor_core();
    EMPTY_ELEMENTS = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "menuitem",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ];
    conf = {
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
      comments: {
        blockComment: ["<!--", "-->"]
      },
      brackets: [
        ["<!--", "-->"],
        ["<", ">"],
        ["{", "}"],
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
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "<", close: ">" }
      ],
      onEnterRules: [
        {
          beforeText: new RegExp("<(?!(?:" + EMPTY_ELEMENTS.join("|") + "))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$", "i"),
          afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
          action: {
            indentAction: languages.IndentAction.IndentOutdent
          }
        },
        {
          beforeText: new RegExp("<(?!(?:" + EMPTY_ELEMENTS.join("|") + "))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$", "i"),
          action: { indentAction: languages.IndentAction.Indent }
        }
      ],
      folding: {
        markers: {
          start: new RegExp("^\\s*<!--\\s*#region\\b.*-->"),
          end: new RegExp("^\\s*<!--\\s*#endregion\\b.*-->")
        }
      }
    };
    language = {
      defaultToken: "",
      tokenPostfix: ".html",
      ignoreCase: true,
      // The main tokenizer for our languages
      tokenizer: {
        root: [
          [/<!DOCTYPE/, "metatag", "@doctype"],
          [/<!--/, "comment", "@comment"],
          [/(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/, ["delimiter", "tag", "", "delimiter"]],
          [/(<)(script)/, ["delimiter", { token: "tag", next: "@script" }]],
          [/(<)(style)/, ["delimiter", { token: "tag", next: "@style" }]],
          [/(<)((?:[\w\-]+:)?[\w\-]+)/, ["delimiter", { token: "tag", next: "@otherTag" }]],
          [/(<\/)((?:[\w\-]+:)?[\w\-]+)/, ["delimiter", { token: "tag", next: "@otherTag" }]],
          [/</, "delimiter"],
          [/[^<]+/]
          // text
        ],
        doctype: [
          [/[^>]+/, "metatag.content"],
          [/>/, "metatag", "@pop"]
        ],
        comment: [
          [/-->/, "comment", "@pop"],
          [/[^-]+/, "comment.content"],
          [/./, "comment.content"]
        ],
        otherTag: [
          [/\/?>/, "delimiter", "@pop"],
          [/"([^"]*)"/, "attribute.value"],
          [/'([^']*)'/, "attribute.value"],
          [/[\w\-]+/, "attribute.name"],
          [/=/, "delimiter"],
          [/[ \t\r\n]+/]
          // whitespace
        ],
        // -- BEGIN <script> tags handling
        // After <script
        script: [
          [/type/, "attribute.name", "@scriptAfterType"],
          [/"([^"]*)"/, "attribute.value"],
          [/'([^']*)'/, "attribute.value"],
          [/[\w\-]+/, "attribute.name"],
          [/=/, "delimiter"],
          [
            />/,
            {
              token: "delimiter",
              next: "@scriptEmbedded",
              nextEmbedded: "text/javascript"
            }
          ],
          [/[ \t\r\n]+/],
          [/(<\/)(script\s*)(>)/, ["delimiter", "tag", { token: "delimiter", next: "@pop" }]]
        ],
        // After <script ... type
        scriptAfterType: [
          [/=/, "delimiter", "@scriptAfterTypeEquals"],
          [
            />/,
            {
              token: "delimiter",
              next: "@scriptEmbedded",
              nextEmbedded: "text/javascript"
            }
          ],
          [/[ \t\r\n]+/],
          [/<\/script\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        // After <script ... type =
        scriptAfterTypeEquals: [
          [
            /"([^"]*)"/,
            {
              token: "attribute.value",
              switchTo: "@scriptWithCustomType.$1"
            }
          ],
          [
            /'([^']*)'/,
            {
              token: "attribute.value",
              switchTo: "@scriptWithCustomType.$1"
            }
          ],
          [
            />/,
            {
              token: "delimiter",
              next: "@scriptEmbedded",
              nextEmbedded: "text/javascript"
            }
          ],
          [/[ \t\r\n]+/],
          [/<\/script\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        // After <script ... type = $S2
        scriptWithCustomType: [
          [
            />/,
            {
              token: "delimiter",
              next: "@scriptEmbedded.$S2",
              nextEmbedded: "$S2"
            }
          ],
          [/"([^"]*)"/, "attribute.value"],
          [/'([^']*)'/, "attribute.value"],
          [/[\w\-]+/, "attribute.name"],
          [/=/, "delimiter"],
          [/[ \t\r\n]+/],
          [/<\/script\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        scriptEmbedded: [
          [/<\/script/, { token: "@rematch", next: "@pop", nextEmbedded: "@pop" }],
          [/[^<]+/, ""]
        ],
        // -- END <script> tags handling
        // -- BEGIN <style> tags handling
        // After <style
        style: [
          [/type/, "attribute.name", "@styleAfterType"],
          [/"([^"]*)"/, "attribute.value"],
          [/'([^']*)'/, "attribute.value"],
          [/[\w\-]+/, "attribute.name"],
          [/=/, "delimiter"],
          [
            />/,
            {
              token: "delimiter",
              next: "@styleEmbedded",
              nextEmbedded: "text/css"
            }
          ],
          [/[ \t\r\n]+/],
          [/(<\/)(style\s*)(>)/, ["delimiter", "tag", { token: "delimiter", next: "@pop" }]]
        ],
        // After <style ... type
        styleAfterType: [
          [/=/, "delimiter", "@styleAfterTypeEquals"],
          [
            />/,
            {
              token: "delimiter",
              next: "@styleEmbedded",
              nextEmbedded: "text/css"
            }
          ],
          [/[ \t\r\n]+/],
          [/<\/style\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        // After <style ... type =
        styleAfterTypeEquals: [
          [
            /"([^"]*)"/,
            {
              token: "attribute.value",
              switchTo: "@styleWithCustomType.$1"
            }
          ],
          [
            /'([^']*)'/,
            {
              token: "attribute.value",
              switchTo: "@styleWithCustomType.$1"
            }
          ],
          [
            />/,
            {
              token: "delimiter",
              next: "@styleEmbedded",
              nextEmbedded: "text/css"
            }
          ],
          [/[ \t\r\n]+/],
          [/<\/style\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        // After <style ... type = $S2
        styleWithCustomType: [
          [
            />/,
            {
              token: "delimiter",
              next: "@styleEmbedded.$S2",
              nextEmbedded: "$S2"
            }
          ],
          [/"([^"]*)"/, "attribute.value"],
          [/'([^']*)'/, "attribute.value"],
          [/[\w\-]+/, "attribute.name"],
          [/=/, "delimiter"],
          [/[ \t\r\n]+/],
          [/<\/style\s*>/, { token: "@rematch", next: "@pop" }]
        ],
        styleEmbedded: [
          [/<\/style/, { token: "@rematch", next: "@pop", nextEmbedded: "@pop" }],
          [/[^<]+/, ""]
        ]
        // -- END <style> tags handling
      }
    };
  }
});
init_html();
export {
  conf,
  language
};
