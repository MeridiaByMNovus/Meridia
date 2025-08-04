const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const fs = require("fs");
const os = require("os");

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = "style-loader";

const config = {
  entry: {
    // index: './src/index.ts',
    // example: "./example/example.ts",
    worker: "./src/code/editor/worker/python/src/pyright-worker/worker.ts",
  },
  output: {
    path: path.resolve(
      __dirname,
      "out",
      "code",
      "editor",
      "worker",
      "python",
      "src"
    ),
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //     template: 'example/index.html',
    //     chunks: [
    //         "example"
    //     ]
    // }),
    new Dotenv(),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.DefinePlugin({
      __fs_constants: JSON.stringify(fs.constants),
      __os_constants: JSON.stringify(os.constants),
    }),
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        loader: "esbuild-loader",
        options: {
          loader: "ts",
          target: "es2020",
        },
      },
      ,
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
      {
        test: /\.(zip|egg)$/i,
        use: ["arraybuffer-loader"],
      },
      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
    parser: {
      javascript: { importMeta: false },
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    alias: {
      // 'tmp': path.resolve("./src/pollyfills/tmp.js"),
      fs: require.resolve("@zenfs/core"),
      // 'buffer': '@zenfs/core/dist/shims/buffer.js',
      // 'path': '@zenfs/core/dist/shims/path.js',
      // 'processGlobal': '@zenfs/core/dist/shims/process.js',
      // 'bufferGlobal': '@zenfs/core/dist/shims/bufferGlobal.js',
    },
    fallback: {
      assert: require.resolve("assert"),
      bfsGlobal: require.resolve("browserfs"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url"),
      zlib: require.resolve("browserify-zlib"),
      vm: require.resolve("vm-browserify"),
      v8: false,
      readline: false,
      worker_threads: false,
      child_process: false,
      os: require.resolve("os-browserify/browser"),
      process: false,
      util: require.resolve("util/"),
    },
  },
  // node: {
  //     process: false,
  //     Buffer: false
  // }
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
    config.devtool = "source-map";
    // config.plugins.push(new webpack.DefinePlugin({
    //     'process.env.NODE_ENV': JSON.stringify(JSON.stringify("development")),
    //     // 'process.env.DEBUG': JSON.stringify(process.env.DEBUG),
    // }));
  }
  return config;
};
