import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),

  new MonacoWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: "node_modules/monaco-pyright-lsp/dist/worker.js",
        to: "./",
      },
      {
        from: "node_modules/monaco-pyright-lsp/dist/worker.js.map",
        to: "./",
      },
      { from: "support/icons", to: "icons/" },
      { from: "support/icons", to: "../renderer/main_window/icons" },
      { from: "theme", to: "theme/" },
      { from: "theme", to: "../renderer/main_window/theme/" },
    ],
  }),
];
